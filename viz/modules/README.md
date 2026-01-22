# Modules Directory

This directory will contain modular Shiny components for each dashboard section.

## Purpose

Breaking dashboard functionality into separate modules improves:
- **Code organization**: Each section has its own file
- **Maintainability**: Easier to update individual sections
- **Reusability**: Modules can be reused across different dashboards
- **Testing**: Individual modules can be tested independently

## Planned Modules

### `introduction.py`
- Static content for the Introduction tab
- Dashboard overview and documentation

### `model_performance.py`
- Disease category selection UI
- Model comparison controls
- Performance visualization (boxplots, tables)
- Reactive data filtering

### `variable_importance.py`
- Variable ranking visualization
- Top N slider control
- Feature importance bar charts
- Category-based filtering

### `multimorbidity.py`
- Network graph visualization
- Correlation threshold controls
- Scatter plots for disease relationships
- Community detection display

### `risk_prediction.py`
- Patient questionnaire UI
- Risk calculation backend
- Risk score display
- Contributing factors visualization

## Module Structure Example

Each module will follow this pattern:

```python
# model_performance.py

from shiny import module, reactive, render, ui
import plotly.express as px

@module.ui
def model_performance_ui():
    return ui.div(
        ui.input_select(
            "disease_category",
            "Disease Category:",
            choices=["All", "Cardiovascular", "Diabetes"]
        ),
        ui.output_plot("performance_plot")
    )

@module.server
def model_performance_server(input, output, session, data):
    @reactive.Calc
    def filtered_data():
        category = input.disease_category()
        if category == "All":
            return data()
        return data()[data()['disease'] == category]

    @render_plotly
    def performance_plot():
        df = filtered_data()
        fig = px.box(df, x='disease', y='auc')
        return fig
```

## Integration into Dashboard

Modules will be imported and used in the main dashboard file:

```python
# In viz/dashboard.qmd

from modules import model_performance

# In UI section
model_performance.model_performance_ui("perf_module")

# In server section
model_performance.model_performance_server("perf_module", data=model_data)
```

## Development Status

Currently, the dashboard uses inline code for the example interactive section.
When real data becomes available, functionality will be refactored into these modular components.
