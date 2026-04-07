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
            steps {
                script {
                    echo 'Building Frontend...'
                    // Build inside a temporary container directory to avoid Jenkins volume file-locking bugs
                    sh '''
                        docker run --rm -u root -v ${WORKSPACE}:/workspace node:18-alpine sh -c "
                            cp -r /workspace/frontend /tmp/frontend &&
                            cd /tmp/frontend &&
                            npm install &&
                            npm run build &&
                            mkdir -p /workspace/backend/static/build &&
                            cp -r build/* /workspace/backend/static/build/ &&
                            chmod -R 777 /workspace/backend/static/build
                        "
                    '''
                }
            }
        }

        stage('Deploy (Part-II)') {
            steps {
                script {
                    echo 'Launching Containerized Deployment...'
                    sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 up -d --build"
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
            echo 'Deployment failed. Checking logs...'
            sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 logs"
        }
    }
}