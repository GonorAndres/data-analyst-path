"""
Shared visualization theme for all data-analyst portfolio projects.
Ensures consistent styling across Plotly, Seaborn, and Matplotlib outputs.
"""

# Portfolio color palette
COLORS = {
    "primary": "#2563EB",      # Blue -- main data series
    "secondary": "#7C3AED",    # Purple -- secondary series
    "success": "#059669",      # Green -- positive/good
    "danger": "#DC2626",       # Red -- negative/bad
    "warning": "#D97706",      # Amber -- caution/highlight
    "neutral": "#6B7280",      # Grey -- context/baseline
    "background": "#FFFFFF",
    "text": "#1F2937",
    "grid": "#E5E7EB",
}

# Sequential palette for ordered data (5 steps)
SEQUENTIAL = ["#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8", "#1E3A8A"]

# Categorical palette (max 7 categories)
CATEGORICAL = [
    "#2563EB", "#7C3AED", "#059669", "#D97706",
    "#DC2626", "#0891B2", "#4F46E5",
]


def apply_plotly_theme(fig):
    """Apply consistent theme to a Plotly figure."""
    fig.update_layout(
        font_family="Inter, system-ui, sans-serif",
        font_color=COLORS["text"],
        plot_bgcolor=COLORS["background"],
        paper_bgcolor=COLORS["background"],
        title_font_size=16,
        title_x=0,
        margin=dict(l=60, r=20, t=60, b=40),
        xaxis=dict(gridcolor=COLORS["grid"], showgrid=True),
        yaxis=dict(gridcolor=COLORS["grid"], showgrid=True),
    )
    return fig


def apply_seaborn_theme():
    """Apply consistent theme to Seaborn/Matplotlib."""
    import seaborn as sns
    import matplotlib.pyplot as plt

    sns.set_theme(style="whitegrid", font="Inter")
    plt.rcParams.update({
        "figure.figsize": (10, 6),
        "axes.titlesize": 14,
        "axes.labelsize": 12,
        "xtick.labelsize": 10,
        "ytick.labelsize": 10,
        "axes.edgecolor": COLORS["grid"],
        "axes.grid": True,
        "grid.color": COLORS["grid"],
        "text.color": COLORS["text"],
    })
