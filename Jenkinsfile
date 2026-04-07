pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.part2.yml'
        PROJECT_NAME = 'hospital_v2'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            when {
                changeset "frontend/**"
            }
            steps {
                script {
                    echo 'Building Frontend...'
                    sh '''
                        docker run --rm \
                            -v ${WORKSPACE}/frontend:/app \
                            -v jenkins_npm_cache:/app/node_modules \
                            node:18-alpine sh -c "
                                cd /app &&
                                if [ ! -d node_modules/.bin ]; then
                                    npm ci --prefer-offline --no-audit
                                fi &&
                                npm run build &&
                                mkdir -p /workspace/backend/static/build &&
                                cp -r build/* /workspace/backend/static/build/
                            "
                    '''
                }
            }
        }

        stage('Deploy (Part-II)') {
            steps {
                script {
                    echo 'Deploying with pre-built image...'
                    
                    // ✅ FIX: Stop and remove old containers to avoid ContainerConfig error
                    sh '''
                        echo "Stopping old containers..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} -p ${PROJECT_NAME} down || true
                        
                        echo "Removing old web container if exists..."
                        docker rm -f hospital-web-v2 2>/dev/null || true
                        
                        echo "Pulling latest image..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} pull web-v2
                        
                        echo "Starting containers..."
                        docker-compose -f ${DOCKER_COMPOSE_FILE} -p ${PROJECT_NAME} up -d --no-build
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Build took: ${currentBuild.durationString}"
        }
        success {
            echo '✅ Deployment successful! Part-II is live on Port 8300.'
        }
        failure {
            echo '❌ Deployment failed. Checking logs...'
            sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p ${PROJECT_NAME} logs --tail=50 || true"
        }
    }
}