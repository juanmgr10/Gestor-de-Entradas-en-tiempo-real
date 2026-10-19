# ---------- Etapa 1: compilación ----------
FROM golang:1.22-alpine AS build
WORKDIR /src
# Cachea dependencias antes de copiar el código
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ---------- Etapa 2: ejecución ----------
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/server /server
USER nonroot:nonroot
EXPOSE 8081
ENV GIN_MODE=release
ENTRYPOINT ["/server"]
