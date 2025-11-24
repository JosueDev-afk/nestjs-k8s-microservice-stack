{{- define "nestjs-microservices.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "nestjs-microservices.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "nestjs-microservices.chart" -}}
{{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "nestjs-microservices.labels" -}}
helm.sh/chart: {{ include "nestjs-microservices.chart" . }}
app.kubernetes.io/name: {{ include "nestjs-microservices.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "nestjs-microservices.component" -}}
{{- $root := index . "root" -}}
{{- $name := index . "name" -}}
{{- printf "%s-%s" (include "nestjs-microservices.fullname" $root) $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "nestjs-microservices.componentFQDN" -}}
{{- $root := index . "root" -}}
{{- $name := index . "name" -}}
{{- printf "%s.%s.svc.cluster.local" (include "nestjs-microservices.component" (dict "root" $root "name" $name)) $root.Release.Namespace -}}
{{- end -}}

{{- define "nestjs-microservices.componentLabels" -}}
{{ include "nestjs-microservices.labels" .root }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "nestjs-microservices.componentSelectorLabels" -}}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "nestjs-microservices.configMapName" -}}
{{- printf "%s-config" (include "nestjs-microservices.component" (dict "root" .root "name" .name)) -}}
{{- end -}}

{{- define "nestjs-microservices.secretName" -}}
{{- printf "%s-secret" (include "nestjs-microservices.component" (dict "root" .root "name" .name)) -}}
{{- end -}}
