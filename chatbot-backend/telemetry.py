"""Privacy-safe tracing and request logs for the public research API."""

import json
import logging
import os
import time
import uuid

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.trace import Status, StatusCode


logger = logging.getLogger("aligatehr.request")
tracer = trace.get_tracer("aligatehr-gen")
_configured = False


def get_tracer():
    return tracer


def configure_telemetry():
    """Enable OTLP export only when an endpoint is explicitly configured."""
    global _configured, tracer
    if _configured:
        return
    _configured = True

    disabled = os.environ.get("OTEL_SDK_DISABLED", "").lower() == "true"
    if disabled or not os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"):
        return

    provider = TracerProvider(
        resource=Resource.create({"service.name": "aligatehr-gen-backend"})
    )
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
    trace.set_tracer_provider(provider)
    tracer = trace.get_tracer("aligatehr-gen")


class RequestTelemetryMiddleware:
    """Trace method/path/status only; never capture query strings or bodies."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = uuid.uuid4().hex
        method = scope["method"]
        path = scope["path"]
        status_code = 500
        started = time.perf_counter()

        async def send_with_request_id(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message["headers"] = headers
            await send(message)

        with tracer.start_as_current_span("http.request") as span:
            span.set_attribute("http.request.method", method)
            span.set_attribute("url.path", path)
            span.set_attribute("request.id", request_id)
            try:
                await self.app(scope, receive, send_with_request_id)
            except Exception as error:
                span.record_exception(error)
                span.set_status(Status(StatusCode.ERROR))
                raise
            finally:
                duration_ms = round((time.perf_counter() - started) * 1000, 2)
                span.set_attribute("http.response.status_code", status_code)
                span.set_attribute("http.server.request.duration_ms", duration_ms)
                logger.info(
                    json.dumps(
                        {
                            "event": "http_request",
                            "request_id": request_id,
                            "method": method,
                            "path": path,
                            "status_code": status_code,
                            "duration_ms": duration_ms,
                        },
                        separators=(",", ":"),
                    )
                )
