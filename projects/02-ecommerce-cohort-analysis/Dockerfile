# Build from repo root: docker build -f projects/02-ecommerce-cohort-analysis/Dockerfile .
FROM python:3.11-slim
WORKDIR /app

COPY projects/02-ecommerce-cohort-analysis/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Inject Google Analytics into Streamlit's index.html
RUN STHTML=$(python -c "import streamlit,os;print(os.path.join(os.path.dirname(streamlit.__file__),'static','index.html'))") && \
    sed -i 's|</head>|<script async src="https://www.googletagmanager.com/gtag/js?id=G-098V02NCB0"></script><script>window.dataLayer=window.dataLayer\|\|[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-098V02NCB0");</script></head>|' "$STHTML" && \
    sed -i 's|</head>|<script>!function(t,e){var o,n,p,r;e.__SV\|\|(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length\&\&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people\|\|[],u.toString=function(t){var e="posthog";return"posthog"!==a\&\&(e+="."+a),t\|\|(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing identify alias people.set people.set_once set_config reset get_distinct_id getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onFeatureFlags onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog\|\|[]);posthog.init("phc_DYrSznvPeJuXPHgj2Nw9BIluiGdwkbuSSih3lu6PtmH",{api_host:"https://us.i.posthog.com",autocapture:false,capture_pageview:true});</script></head>|' "$STHTML"

# Streamlit app
COPY projects/02-ecommerce-cohort-analysis/streamlit/ ./streamlit/

# Processed data (relative path expected by data_loader: ../../data/processed/)
COPY projects/02-ecommerce-cohort-analysis/data/processed/ ./data/processed/

EXPOSE 8501
CMD ["streamlit", "run", "streamlit/app.py", "--server.port=8501", "--server.address=0.0.0.0", "--server.headless=true"]
