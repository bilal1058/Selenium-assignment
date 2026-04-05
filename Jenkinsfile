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
            steps {
                script {
                    echo 'Building Frontend...'
                    docker.image('node:18-alpine').inside('-u root') {
                        sh '''
                            cd frontend
                            npm install
                            npm run build
                            mkdir -p ../backend/static/build
                            cp -r build/* ../backend/static/build/
                            chmod -R 777 ../backend/static/build
                        '''
                    }
                }
            }
        }

        stage('Verify Backend') {
            steps {
                script {
                    echo 'Verifying Backend Requirements...'
                    sh 'pip install --user -r backend/requirements.txt'
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
        success {
            echo 'Deployment successful! Part-II is live on Port 8300.'
        }
        failure {
            echo 'Deployment failed. Checking logs...'
            sh "docker-compose -f ${DOCKER_COMPOSE_FILE} -p hospital_v2 logs"
        }
    }
}
