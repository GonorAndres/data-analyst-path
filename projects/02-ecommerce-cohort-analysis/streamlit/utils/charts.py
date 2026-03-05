"""Plotly figure builder functions with consistent styling."""

import plotly.graph_objects as go
import plotly.express as px
import numpy as np

# Color system
NAVY = "#1B2A4A"
ACCENT = "#2563EB"
SUCCESS = "#059669"
DANGER = "#DC2626"
WARNING = "#D97706"
TEXT_PRIMARY = "#1E293B"
TEXT_MUTED = "#64748B"
GRID = "#E2E8F0"

CATEGORICAL = ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2", "#4F46E5"]
SEQUENTIAL_BLUES = ["#EFF6FF", "#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8", "#1E3A8A"]


def _base_layout():
    return dict(
        font_family="Inter, system-ui, sans-serif",
        font_color=TEXT_PRIMARY,
        plot_bgcolor="#FFFFFF",
        paper_bgcolor="#FFFFFF",
        margin=dict(l=50, r=30, t=50, b=40),
        xaxis=dict(gridcolor=GRID, showgrid=True, zeroline=False),
        yaxis=dict(gridcolor=GRID, showgrid=True, zeroline=False),
        title_x=0,
        title_font_size=16,
        legend=dict(
            bgcolor="rgba(255,255,255,0.9)",
            bordercolor=GRID,
            borderwidth=1,
            font_size=12,
        ),
    )


def style_fig(fig, height=400):
    fig.update_layout(**_base_layout(), height=height)
    return fig


def area_chart(df, x, y, title="", color=ACCENT, height=400):
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df[x], y=df[y],
        fill="tozeroy",
        fillcolor=f"rgba(37,99,235,0.12)",
        line=dict(color=color, width=2.5),
        mode="lines",
    ))
    fig.update_layout(**_base_layout(), title=title, height=height, showlegend=False)
    return fig


def bar_chart(df, x, y, title="", color=ACCENT, horizontal=False, height=400):
    if horizontal:
        fig = go.Figure(go.Bar(x=df[y], y=df[x], orientation="h",
                               marker_color=color))
    else:
        fig = go.Figure(go.Bar(x=df[x], y=df[y], marker_color=color))
    fig.update_layout(**_base_layout(), title=title, height=height, showlegend=False)
    return fig


def colored_bar_chart(df, x, y, colors, title="", horizontal=False, height=400):
    if horizontal:
        fig = go.Figure(go.Bar(x=df[y], y=df[x], orientation="h",
                               marker_color=colors))
    else:
        fig = go.Figure(go.Bar(x=df[x], y=df[y], marker_color=colors))
    fig.update_layout(**_base_layout(), title=title, height=height, showlegend=False)
    return fig


def line_chart(df, x, y, color_col=None, title="", height=400):
    if color_col:
        fig = px.line(df, x=x, y=y, color=color_col,
                      color_discrete_sequence=CATEGORICAL)
    else:
        fig = go.Figure(go.Scatter(x=df[x], y=df[y], mode="lines",
                                   line=dict(color=ACCENT, width=2.5)))
    fig.update_layout(**_base_layout(), title=title, height=height)
    return fig


def heatmap(z, x_labels, y_labels, text=None, title="", colorscale=None, height=500):
    if colorscale is None:
        colorscale = [[0, "#EFF6FF"], [0.25, "#DBEAFE"], [0.5, "#93C5FD"],
                      [0.75, "#3B82F6"], [1.0, "#1D4ED8"]]
    fig = go.Figure(go.Heatmap(
        z=z, x=x_labels, y=y_labels,
        text=text, texttemplate="%{text}",
        colorscale=colorscale,
        hoverongaps=False,
    ))
    fig.update_layout(**_base_layout(), title=title, height=height)
    fig.update_yaxes(autorange="reversed")
    return fig


def scatter_chart(df, x, y, size=None, color=None, title="", height=450,
                  color_discrete_map=None):
    fig = px.scatter(
        df, x=x, y=y, size=size, color=color,
        color_discrete_sequence=CATEGORICAL,
        color_discrete_map=color_discrete_map,
    )
    fig.update_layout(**_base_layout(), title=title, height=height)
    return fig


def funnel_chart(labels, values, title="", height=350):
    fig = go.Figure(go.Funnel(
        y=labels, x=values,
        textinfo="value+percent initial",
        marker=dict(color=[ACCENT, "#3B82F6", "#60A5FA", "#93C5FD"]),
        connector=dict(line=dict(color=GRID)),
    ))
    fig.update_layout(**_base_layout(), title=title, height=height, showlegend=False)
    return fig


def error_bar_chart(df, x, y, lower, upper, title="", height=400):
    """Horizontal bar chart with CI error bars."""
    fig = go.Figure()
    colors = [SUCCESS if v > 0 else DANGER for v in df[y]]
    fig.add_trace(go.Bar(
        y=df[x], x=df[y], orientation="h",
        marker_color=colors,
        error_x=dict(
            type="data",
            symmetric=False,
            array=(df[upper] - df[y]).tolist(),
            arrayminus=(df[y] - df[lower]).tolist(),
            color=TEXT_MUTED,
            thickness=1.5,
        ),
    ))
    fig.add_vline(x=0, line_dash="dash", line_color=TEXT_MUTED, line_width=1)
    fig.update_layout(**_base_layout(), title=title, height=height, showlegend=False)
    return fig
