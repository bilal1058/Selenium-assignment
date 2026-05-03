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
                sh '''
                    $COMPOSE down 2>/dev/null || true
                    $COMPOSE up -d
                    sleep 15
                '''
            }
        }
        
        stage('Run Selenium Tests') {
            steps {
                sh '''
                    docker run --rm --network host \
                        -v ${WORKSPACE}/selenium-tests:/tests \
                        -w /tests \
                        bilal888/selenium-test:latest \
                        pytest test_all.py -v --html=report.html --self-contained-html --tb=short
                '''
            }
        }
    }
    
    post {
        always {
            script {
                // Fix Git safe directory issue
                sh "git config --global --add safe.directory ${env.WORKSPACE}"

                // Extract committer email
                def committer = sh(
                    script: "git log -1 --pretty=format:'%ae'",
                    returnStdout: true
                ).trim()

                archiveArtifacts artifacts: 'selenium-tests/report.html', allowEmptyArchive: true
                
                emailext (
                    to: committer,
                    subject: "Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                        <h2>Test Results</h2>
                        <p><b>Result:</b> ${currentBuild.result}</p>
                        <p><b>Build:</b> ${env.BUILD_URL}</p>
                        <p>Report: ${env.BUILD_URL}artifact/selenium-tests/report.html</p>
                    """,
                    attachLog: true,
                    attachmentsPattern: 'selenium-tests/report.html'
                )
            }
            
            sh '$COMPOSE down || true'
        }
    }
}
