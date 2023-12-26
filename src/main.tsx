import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor, TracerConfig, WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ErrorBoundary } from 'react-error-boundary';

const providerConfig: TracerConfig = {
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'otelpoc',
  }),
};

const provider = new WebTracerProvider(providerConfig);
const collectorExporter = new OTLPTraceExporter({
  headers: {}
});


provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.addSpanProcessor(new BatchSpanProcessor(collectorExporter));

provider.register({
  contextManager: new ZoneContextManager(),
});

registerInstrumentations({
  instrumentations: [
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-fetch': {
        ignoreUrls: [/localhost/],
      },
    }),
  ],
  tracerProvider: provider
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong</div>} onError={(error, info) => {
      const span = provider.getTracer('default').startSpan('error');
      span.setAttribute('error', true);
      span.setAttribute('error.message', error.message);
      span.setAttribute('error.stack', error.stack || '');
      span.setAttribute('error.name', error.name);
      span.setAttribute('error.componentStack', info.componentStack || '');
      span.end();
    }}>
    <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
