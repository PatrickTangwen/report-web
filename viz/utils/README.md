# Utils Directory

This directory will contain utility functions and helper modules used across the dashboard.

## Purpose

Utility functions provide:
- **Reusable code**: Shared functionality across multiple modules
- **Separation of concerns**: Data processing, plotting, and business logic separated from UI code
- **Easier testing**: Pure functions are easier to unit test
- **Code clarity**: Keep dashboard modules focused on UI/reactivity

## Planned Utilities

### `plotting.py`
Common visualization functions:
- `create_performance_boxplot(data, metric)`: Standardized boxplot for model performance
- `create_importance_barplot(data, top_n)`: Feature importance horizontal bar chart
- `create_network_graph(data, threshold)`: Disease co-occurrence network visualization
- `create_survival_curve(data, risk_group)`: Kaplan-Meier survival curves
- `apply_theme(fig, title)`: Apply consistent styling to all Plotly figures

Example:
```python
# plotting.py

import plotly.express as px
import plotly.graph_objects as go

def create_performance_boxplot(data, metric='auc', color_by='model'):
    """
    Create standardized boxplot for model performance metrics.

    Args:
        data (pd.DataFrame): Performance data with disease, model, and metric columns
        metric (str): Metric to plot (auc, accuracy, f1, etc.)
        color_by (str): Column to use for color grouping

    Returns:
        plotly.graph_objects.Figure
    """
    fig = px.box(
        data,
        x='disease',
        y=metric,
        color=color_by,
        title=f"{metric.upper()} Performance by Disease Category"
    )

    fig.update_layout(
        xaxis_tickangle=-45,
        template="plotly_white",
        height=500,
        legend_title=color_by.replace('_', ' ').title()
    )

    return fig

def apply_theme(fig, title=None):
    """Apply consistent theme to all dashboard charts."""
    fig.update_layout(
        template="plotly_white",
        font=dict(family="Source Sans Pro, sans-serif"),
        title_font_size=16,
        title_font_color="#2c3e50"
    )
    if title:
        fig.update_layout(title=title)
    return fig
```

### `data_processing.py`
Data manipulation and preparation functions:
- `load_and_validate_data(filepath)`: Load CSV with schema validation
- `filter_by_disease(data, disease)`: Common filtering operation
- `calculate_summary_stats(data)`: Generate summary statistics tables
- `prepare_network_data(data, threshold)`: Transform co-occurrence data for network visualization
- `compute_risk_score(patient_features, model)`: Calculate individual risk predictions

Example:
```python
# data_processing.py

import pandas as pd
from pathlib import Path

def load_and_validate_data(filepath, expected_columns):
    """
    Load CSV data with validation.

    Args:
        filepath (str or Path): Path to CSV file
        expected_columns (list): Required column names

    Returns:
        pd.DataFrame

    Raises:
        ValueError: If expected columns are missing
    """
    data = pd.read_csv(filepath)

    missing_cols = set(expected_columns) - set(data.columns)
    if missing_cols:
        raise ValueError(f"Missing columns: {missing_cols}")

    return data

def filter_by_disease(data, disease_list):
    """Filter dataset by disease categories."""
    if "All" in disease_list or not disease_list:
        return data
    return data[data['disease'].isin(disease_list)]

def calculate_summary_stats(data, group_by, metrics):
    """
    Calculate summary statistics grouped by specified column.

    Args:
        data (pd.DataFrame): Input data
        group_by (str): Column to group by
        metrics (list): List of metric columns to summarize

    Returns:
        pd.DataFrame with mean, std, min, max for each metric
    """
    summary = data.groupby(group_by)[metrics].agg(['mean', 'std', 'min', 'max'])
    return summary.round(3)
```

### `config.py`
Configuration constants and settings:
- Color schemes
- Chart dimensions
- Data file paths
- Model parameters
- API endpoints (if applicable)

Example:
```python
# config.py

from pathlib import Path

# Paths
DATA_DIR = Path(__file__).parent.parent / "data" / "processed"
MODEL_PERFORMANCE_FILE = DATA_DIR / "model_performance.csv"
VARIABLE_IMPORTANCE_FILE = DATA_DIR / "variable_importance.csv"

# Visualization settings
CHART_HEIGHT = 500
CHART_WIDTH = 800
COLOR_PALETTE = ['#2c5aa0', '#e74c3c', '#27ae60', '#f39c12', '#8e44ad']

# Model settings
MODELS = ['RandomForest', 'XGBoost', 'DNN']
DISEASE_CATEGORIES = [
    'Cardiovascular', 'Diabetes', 'Respiratory',
    'Mental Health', 'Cancer', 'Musculoskeletal'
]

# Performance metrics
METRICS = ['auc', 'accuracy', 'precision', 'recall', 'f1']
```

## Usage Example

In dashboard modules:

```python
# In viz/modules/model_performance.py

from utils.plotting import create_performance_boxplot, apply_theme
from utils.data_processing import load_and_validate_data, filter_by_disease
from utils.config import MODEL_PERFORMANCE_FILE, MODELS

# Load data
data = load_and_validate_data(
    MODEL_PERFORMANCE_FILE,
    expected_columns=['disease', 'model', 'auc', 'accuracy']
)

# Filter data
filtered = filter_by_disease(data, selected_diseases)

# Create visualization
fig = create_performance_boxplot(filtered, metric='auc')
fig = apply_theme(fig, title="Model Performance Comparison")
```

## Development Status

Currently placeholder. Utility functions will be developed as dashboard sections are implemented and common patterns emerge.
