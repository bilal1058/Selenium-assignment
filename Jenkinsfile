pipeline {
    agent any
    
    environment {
        APP_URL = 'http://13.233.39.193:8202'
        COMPOSE = 'docker-compose -f docker-compose.yml -p hospital'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Deploy Application') {
            steps {
                script {
                    echo 'Starting application containers...'
                    sh '''
                        $COMPOSE down 2>/dev/null || true
                        $COMPOSE up -d
                        
                        echo "Waiting for app to be ready..."
                        for i in {1..30}; do
                            if curl -s ${APP_URL}/health > /dev/null 2>&1; then
                                echo "App is ready!"
                                break
                            fi
                            echo "Attempt $i/30..."
                            sleep 2
                        done
                    '''
                }
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                script {
                    echo 'Running tests in containerized environment...'
                    sh '''
                        docker run --rm --network host \
                            -v ${WORKSPACE}/selenium-tests:/tests \
                            -w /tests \
                            python:3.11-slim bash -c "
                                apt-get update -qq && \
                                apt-get install -y -qq wget gnupg unzip chromium chromium-driver > /dev/null 2>&1 && \
                                pip install -q -r requirements.txt && \
                                pytest -v --html=report.html --self-contained-html --tb=short
                            "
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Publish HTML report
                publishHTML(target: [
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'selenium-tests',
                    reportFiles: 'report.html',
                    reportName: 'Selenium Test Report'
                ])
            }
            
            // Email results to committer
            emailext (
                subject: "Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <h2>Test Results for ${env.JOB_NAME}</h2>
                    <p><b>Build Result:</b> ${currentBuild.result}</p>
                    <p><b>Committer:</b> ${env.GIT_COMMITTER_NAME} &lt;${env.GIT_COMMITTER_EMAIL}&gt;</p>
                    <p><b>Build URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p><b>Test Report:</b> <a href="${env.BUILD_URL}artifact/selenium-tests/report.html">View Report</a></p>
                    <p><b>Duration:</b> ${currentBuild.durationString}</p>
                """,
                to: '${env.GIT_COMMITTER_EMAIL}',
                attachLog: true,
                attachmentsPattern: 'selenium-tests/report.html'
            )
            
            // Cleanup - stop deployment
            sh '$COMPOSE down || true'
        }
        
        success {
            echo '✅ All tests passed! Results emailed to committer.'
        }
        
        failure {
            echo '❌ Tests failed. Check email for details.'
        }
    }
}