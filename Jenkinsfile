pipeline {
    agent any
    
    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.part2.yml'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            when {
                changeset "**/frontend/**"
            }
            steps {
                script {
                    echo 'Building Frontend...'
                    sh '''
                        docker run --rm -u root -v ${WORKSPACE}:/workspace node:18-alpine sh -c "
                            cd /workspace/frontend &&
                            npm install &&
                            npm run build &&
                            mkdir -p /workspace/backend/static/build &&
                            cp -r build/* /workspace/backend/static/build/
                        "
                    '''
                }
            }
        }

        stage('Deploy (Fast)') {
            steps {
                script {
                    echo 'Deploying without rebuild...'
                    sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 up -d"
                }
            }
        }

    }

    post {
        success {
            echo 'Deployment successful. App running on port 8300.'
        }
        failure {
            echo 'Deployment failed. Showing logs...'
            sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 logs"
        }
    }
}
