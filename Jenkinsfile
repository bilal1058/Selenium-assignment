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
                        pytest test_all.py -v \
                        --html=report.html \
                        --self-contained-html \
                        --tb=short \
                        --junitxml=results.xml
                '''
            }
        }
    }
    
    post {
        always {
            script {
                // Fix git safe directory
                sh "git config --global --add safe.directory ${env.WORKSPACE}"

                // Get committer email
                def committer = sh(
                    script: "git log -1 --pretty=format:'%ae'",
                    returnStdout: true
                ).trim()

                // Archive report
                archiveArtifacts artifacts: 'selenium-tests/report.html', allowEmptyArchive: true

                // Read test summary from XML
                def summaryLine = sh(
                    script: "grep -h '<testsuite' selenium-tests/results.xml || true",
                    returnStdout: true
                ).trim()

                int total = 0
                int failures = 0
                int skipped = 0
                int passed = 0

                if (summaryLine) {
                    total = (summaryLine =~ /tests="(\\d+)"/)[0][1] as int
                    failures = (summaryLine =~ /failures="(\\d+)"/)[0][1] as int
                    skipped = (summaryLine =~ /skipped="(\\d+)"/)[0][1] as int
                    passed = total - failures - skipped
                }

                def emailBody = """
Test Summary (Build #${env.BUILD_NUMBER})

Total Tests:   ${total}
Passed:        ${passed}
Failed:        ${failures}
Skipped:       ${skipped}

Build URL: ${env.BUILD_URL}
Report: ${env.BUILD_URL}artifact/selenium-tests/report.html
"""

                emailext(
                    to: committer ?: 'muhammadbilal10582@gmail.com',
                    subject: "Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: emailBody,
                    attachLog: true,
                    attachmentsPattern: 'selenium-tests/report.html'
                )
            }
            
            // Always shut down containers
            sh '$COMPOSE down || true'
        }
    }
}
