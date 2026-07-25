pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    APP_NETWORK = 'user1-liemresearch'
    BACKEND_IMAGE = 'user1-liemresearch-backend'
    WEB_IMAGE = 'user1-liemresearch-web'
    BACKEND_CONTAINER = 'user1-liemresearch-backend'
    WEB_CONTAINER = 'user1-liemresearch-web'
    LIBRETRANSLATE_IMAGE = 'libretranslate/libretranslate:v1.9.6'
    LIBRETRANSLATE_CONTAINER = 'user1-liemresearch-libretranslate'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.IMAGE_TAG = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
        }
      }
    }

    stage('Build immutable images') {
      steps {
        sh '''
          set -eu
          docker build --pull -t "$BACKEND_IMAGE:$IMAGE_TAG" -f Dockerfile.backend .
          docker build --pull \
            --build-arg VITE_API_BASE=https://api.paperlens.uk/api/v1 \
            -t "$WEB_IMAGE:$IMAGE_TAG" \
            -f Dockerfile.web .
          docker pull "$LIBRETRANSLATE_IMAGE"
        '''
      }
    }

    stage('Validate production environment') {
      steps {
        withCredentials([string(credentialsId: 'liemresearch-backend-env-b64', variable: 'BACKEND_ENV_B64')]) {
          sh '''
            set -eu
            umask 077
            printf '%s' "$BACKEND_ENV_B64" | base64 -d > .env.runtime
            docker run --rm \
              --env-file .env.runtime \
              "$BACKEND_IMAGE:$IMAGE_TAG" \
              pnpm --filter backend env:validate:production -- --process-env
          '''
        }
      }
    }

    stage('Deploy dependencies') {
      steps {
        sh '''
          set -eu
          docker network inspect "$APP_NETWORK" >/dev/null 2>&1 || docker network create "$APP_NETWORK"
          docker rm -f "$LIBRETRANSLATE_CONTAINER" >/dev/null 2>&1 || true
          docker run -d \
            --name "$LIBRETRANSLATE_CONTAINER" \
            --restart unless-stopped \
            --network "$APP_NETWORK" \
            --network-alias libretranslate \
            -e LT_LOAD_ONLY=en,vi,es,fr,de,pt,zh,ja,ko,ru,id \
            "$LIBRETRANSLATE_IMAGE"

          translation_ready=0
          for attempt in $(seq 1 120); do
            if docker exec "$LIBRETRANSLATE_CONTAINER" \
              python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5000/languages', timeout=3)"; then
              translation_ready=1
              break
            fi
            sleep 2
          done

          if [ "$translation_ready" -ne 1 ]; then
            docker logs --tail 200 "$LIBRETRANSLATE_CONTAINER"
            exit 1
          fi
        '''
      }
    }

    stage('Deploy backend, web and workers') {
      steps {
        withCredentials([string(credentialsId: 'liemresearch-backend-env-b64', variable: 'BACKEND_ENV_B64')]) {
          sh '''
            set -eu
            umask 077
            printf '%s' "$BACKEND_ENV_B64" | base64 -d > .env.runtime

            candidate="${BACKEND_CONTAINER}-candidate"
            docker rm -f "$candidate" >/dev/null 2>&1 || true
            docker run -d \
              --name "$candidate" \
              --network "$APP_NETWORK" \
              --env-file .env.runtime \
              -e NODE_ENV=production \
              -e PORT=4000 \
              -e CORS_ORIGIN=https://paperlens.uk \
              -e GOOGLE_CALLBACK_URL=https://api.paperlens.uk/api/v1/auth/google/callback \
              -e TRANSLATION_PROVIDER=libretranslate \
              -e LIBRETRANSLATE_URL=http://libretranslate:5000 \
              "$BACKEND_IMAGE:$IMAGE_TAG"

            candidate_ready=0
            for attempt in $(seq 1 45); do
              if docker exec "$candidate" node -e \
                "fetch('http://127.0.0.1:4000/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
                candidate_ready=1
                break
              fi
              sleep 2
            done
            if [ "$candidate_ready" -ne 1 ]; then
              docker logs --tail 200 "$candidate"
              docker rm -f "$candidate" >/dev/null 2>&1 || true
              exit 1
            fi
            docker rm -f "$candidate"

            docker rm -f "$BACKEND_CONTAINER" >/dev/null 2>&1 || true
            docker run -d \
              --name "$BACKEND_CONTAINER" \
              --restart unless-stopped \
              --network "$APP_NETWORK" \
              --network-alias backend \
              -p 127.0.0.1:9000:4000 \
              --env-file .env.runtime \
              -e NODE_ENV=production \
              -e PORT=4000 \
              -e CORS_ORIGIN=https://paperlens.uk \
              -e GOOGLE_CALLBACK_URL=https://api.paperlens.uk/api/v1/auth/google/callback \
              -e TRANSLATION_PROVIDER=libretranslate \
              -e LIBRETRANSLATE_URL=http://libretranslate:5000 \
              -v user1-liemresearch-uploads:/app/apps/backend/uploads \
              "$BACKEND_IMAGE:$IMAGE_TAG"

            backend_ready=0
            for attempt in $(seq 1 45); do
              if docker exec "$BACKEND_CONTAINER" node -e \
                "fetch('http://127.0.0.1:4000/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
                backend_ready=1
                break
              fi
              sleep 2
            done
            if [ "$backend_ready" -ne 1 ]; then
              docker logs --tail 200 "$BACKEND_CONTAINER"
              exit 1
            fi

            docker rm -f "$WEB_CONTAINER" >/dev/null 2>&1 || true
            docker run -d \
              --name "$WEB_CONTAINER" \
              --restart unless-stopped \
              --network "$APP_NETWORK" \
              -p 127.0.0.1:9001:80 \
              "$WEB_IMAGE:$IMAGE_TAG"
            docker exec "$WEB_CONTAINER" wget -qO- http://127.0.0.1/ >/dev/null

            worker_specs='
              report|worker:report
              gaps|worker:gaps
              notifications|worker:notifications
              embedding|worker:embedding
              paper-analysis|worker:paper-analysis
              corpus-validation|worker:corpus-validation
            '
            printf '%s\n' "$worker_specs" | while IFS='|' read -r suffix command; do
              suffix=$(printf '%s' "$suffix" | xargs)
              command=$(printf '%s' "$command" | xargs)
              [ -n "$suffix" ] || continue
              container="user1-liemresearch-worker-$suffix"
              docker rm -f "$container" >/dev/null 2>&1 || true
              docker run -d \
                --name "$container" \
                --restart unless-stopped \
                --network "$APP_NETWORK" \
                --env-file .env.runtime \
                -e NODE_ENV=production \
                "$BACKEND_IMAGE:$IMAGE_TAG" \
                pnpm --filter backend "$command"
            done

            sleep 5
            printf '%s\n' "$worker_specs" | while IFS='|' read -r suffix command; do
              suffix=$(printf '%s' "$suffix" | xargs)
              [ -n "$suffix" ] || continue
              container="user1-liemresearch-worker-$suffix"
              if [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null || true)" != "true" ]; then
                docker logs --tail 200 "$container" || true
                exit 1
              fi
            done

            docker run --rm \
              --network "$APP_NETWORK" \
              --env-file .env.runtime \
              -e NODE_ENV=production \
              "$BACKEND_IMAGE:$IMAGE_TAG" \
              pnpm --filter backend workers:verify:heartbeats

            docker tag "$BACKEND_IMAGE:$IMAGE_TAG" "$BACKEND_IMAGE:latest"
            docker tag "$WEB_IMAGE:$IMAGE_TAG" "$WEB_IMAGE:latest"
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'rm -f .env.runtime'
    }
    success {
      echo "Deployed PaperLens image tag ${env.IMAGE_TAG}"
    }
  }
}
