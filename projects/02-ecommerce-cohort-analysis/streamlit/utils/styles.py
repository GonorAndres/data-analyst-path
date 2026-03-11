"""Global CSS injection for the Streamlit dashboard."""

import streamlit as st

# -- Color system --
NAVY = "#1B2A4A"
ACCENT = "#2563EB"
SUCCESS = "#059669"
DANGER = "#DC2626"
WARNING = "#D97706"
SURFACE = "#F8FAFC"
BORDER = "#E2E8F0"
TEXT_PRIMARY = "#1E293B"
TEXT_MUTED = "#64748B"


def inject_styles():
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600;700&display=swap');

        /* Global */
        html, body, [class*="css"] {
            font-family: 'Inter', system-ui, sans-serif;
            color: #1E293B;
        }

        /* Hide footer only -- keep header for sidebar toggle */
        footer {visibility: hidden;}

        /* Sidebar */
        section[data-testid="stSidebar"] {
            background-color: #1B2A4A;
            color: #F8FAFC;
        }
        section[data-testid="stSidebar"],
        section[data-testid="stSidebar"] * {
            color: #F8FAFC !important;
        }
        section[data-testid="stSidebar"] .stMarkdown a {
            color: #93C5FD !important;
        }
        section[data-testid="stSidebar"] hr {
            border-color: rgba(255,255,255,0.15);
        }
        /* Sidebar nav links */
        section[data-testid="stSidebar"] a[data-testid="stSidebarNavLink"],
        section[data-testid="stSidebar"] a[data-testid="stSidebarNavLink"] span,
        section[data-testid="stSidebar"] a[data-testid="stSidebarNavLink"] p {
            color: #CBD5E1 !important;
        }
        section[data-testid="stSidebar"] a[data-testid="stSidebarNavLink"]:hover,
        section[data-testid="stSidebar"] a[data-testid="stSidebarNavLink"]:hover span {
            color: #FFFFFF !important;
            background-color: rgba(255,255,255,0.1) !important;
        }
        section[data-testid="stSidebar"] a[data-testid="stSidebarNavLink"][aria-current="page"],
        section[data-testid="stSidebar"] a[data-testid="stSidebarNavLink"][aria-current="page"] span {
            color: #FFFFFF !important;
            background-color: rgba(37,99,235,0.3) !important;
            font-weight: 600;
        }
        /* Sidebar widget labels, inputs, selects */
        section[data-testid="stSidebar"] label,
        section[data-testid="stSidebar"] .stSelectbox label,
        section[data-testid="stSidebar"] .stMultiSelect label,
        section[data-testid="stSidebar"] .stRadio label,
        section[data-testid="stSidebar"] .stSlider label,
        section[data-testid="stSidebar"] .stCheckbox label {
            color: #E2E8F0 !important;
        }
        section[data-testid="stSidebar"] .stSelectbox [data-baseweb="select"],
        section[data-testid="stSidebar"] .stMultiSelect [data-baseweb="select"] {
            background-color: rgba(255,255,255,0.1) !important;
            border-color: rgba(255,255,255,0.2) !important;
        }
        section[data-testid="stSidebar"] .stSelectbox [data-baseweb="select"] *,
        section[data-testid="stSidebar"] .stMultiSelect [data-baseweb="select"] * {
            color: #F8FAFC !important;
        }
        /* Sidebar small/caption text */
        section[data-testid="stSidebar"] small,
        section[data-testid="stSidebar"] .stCaption,
        section[data-testid="stSidebar"] span[data-testid="stCaptionContainer"] {
            color: #94A3B8 !important;
        }

        /* KPI Card */
        .kpi-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-left: 4px solid #2563EB;
            border-radius: 8px;
            padding: 20px 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .kpi-card .kpi-value {
            font-family: 'DM Sans', sans-serif;
            font-size: 36px;
            font-weight: 700;
            color: #1E293B;
            line-height: 1.1;
            margin-bottom: 4px;
        }
        .kpi-card .kpi-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748B;
            margin-bottom: 4px;
        }
        .kpi-card .kpi-delta-up {
            font-size: 13px;
            font-weight: 600;
            color: #059669;
        }
        .kpi-card .kpi-delta-down {
            font-size: 13px;
            font-weight: 600;
            color: #DC2626;
        }
        .kpi-card .kpi-delta-neutral {
            font-size: 13px;
            font-weight: 600;
            color: #64748B;
        }

        /* Insight Box */
        .insight-box {
            border-radius: 8px;
            padding: 20px 24px;
            margin: 16px 0;
            border-left: 4px solid #2563EB;
            background: #EFF6FF;
        }
        .insight-box.success {
            border-left-color: #059669;
            background: #ECFDF5;
        }
        .insight-box.warning {
            border-left-color: #D97706;
            background: #FFFBEB;
        }
        .insight-box .insight-header {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #1B2A4A;
            margin-bottom: 8px;
        }
        .insight-box .insight-finding {
            font-size: 15px;
            color: #1E293B;
            margin-bottom: 12px;
            line-height: 1.5;
        }
        .insight-box .insight-rec {
            font-size: 14px;
            color: #334155;
            line-height: 1.5;
        }
        .insight-box .insight-rec strong {
            color: #1E293B;
        }

        /* Chart Container */
        .chart-container {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 24px;
            margin: 12px 0;
        }
        .chart-container .chart-title {
            font-size: 18px;
            font-weight: 600;
            color: #1E293B;
            margin-bottom: 2px;
        }
        .chart-container .chart-subtitle {
            font-size: 14px;
            color: #64748B;
            margin-bottom: 16px;
        }
        .chart-container .chart-interpretation {
            font-size: 14px;
            color: #334155;
            line-height: 1.6;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #E2E8F0;
        }
        .chart-container .chart-source {
            font-size: 12px;
            color: #94A3B8;
            margin-top: 8px;
        }

        /* Contexto box */
        .contexto-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 20px 24px;
            margin-bottom: 24px;
        }
        .contexto-box p {
            font-size: 15px;
            color: #334155;
            line-height: 1.6;
            margin: 0;
        }

        /* Footer */
        .dashboard-footer {
            text-align: center;
            font-size: 12px;
            color: #94A3B8;
            padding: 24px 0 12px;
            border-top: 1px solid #E2E8F0;
            margin-top: 48px;
        }

        /* Page header */
        .page-header {
            font-family: 'DM Sans', sans-serif;
            font-size: 28px;
            font-weight: 700;
            color: #1B2A4A;
            margin-bottom: 4px;
        }
        .page-subheader {
            font-size: 15px;
            color: #64748B;
            margin-bottom: 24px;
        }

        /* Print */
        @media print {
            section[data-testid="stSidebar"] { display: none !important; }
            .dashboard-footer { page-break-before: avoid; }
        }

        /* Download button styling */
        .stDownloadButton button {
            background-color: #1B2A4A !important;
            color: #F8FAFC !important;
            border: 1px solid rgba(255,255,255,0.2) !important;
            border-radius: 6px !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            padding: 4px 12px !important;
        }
        .stDownloadButton button:hover {
            background-color: #2563EB !important;
            border-color: #2563EB !important;
        }

        /* Tab panel padding */
        .stTabs [data-baseweb="tab-panel"] {
            padding-top: 8px !important;
        }

        /* Filter badge pill */
        .filter-badge {
            display: inline-block;
            background: #EFF6FF;
            color: #1D4ED8;
            border: 1px solid #BFDBFE;
            border-radius: 12px;
            padding: 2px 10px;
            font-size: 12px;
            font-weight: 500;
            margin: 2px 3px;
        }

        /* Streamlit overrides */
        .stTabs [data-baseweb="tab-list"] {
            gap: 8px;
        }
        .stTabs [data-baseweb="tab"] {
            font-family: 'Inter', sans-serif;
            font-weight: 600;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )
