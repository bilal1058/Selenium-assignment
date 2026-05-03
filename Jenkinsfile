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
                    mkdir -p selenium-tests

                    docker run --rm --network host \
                        -v ${WORKSPACE}/selenium-tests:/tests \
                        -w /tests \
                        bilal888/selenium-test:latest \
                        pytest test_all.py -v \
                        --html=report.html \
                        --self-contained-html \
                        --junitxml=results.xml \
                        --tb=short
                '''
            }
        }

        stage('Publish Test Results') {
            steps {
                junit '**/selenium-tests/results.xml'
            }
        }
    }

    post {
        always {
            script {

                // Safe git configuration
                sh "git config --global --add safe.directory ${env.WORKSPACE}"

                // Safe committer extraction
                def committer = sh(
                    script: "git log -1 --pretty=format:'%ae' || echo ''",
                    returnStdout: true
                ).trim()

                if (!committer) {
                    committer = 'muhammadbilal10582@gmail.com'
                }

                // Archive HTML report safely
                archiveArtifacts artifacts: 'selenium-tests/report.html', allowEmptyArchive: true

                // Default safe values
                int total = 0
                int failures = 0
                int skipped = 0
                int passed = 0

                // Read XML safely
                def xmlLine = sh(
                    script: "grep -h '<testsuite' selenium-tests/results.xml 2>/dev/null || true",
                    returnStdout: true
                ).trim()

                if (xmlLine) {

                    def t = (xmlLine =~ /tests="(\\d+)"/)
                    def f = (xmlLine =~ /failures="(\\d+)"/)
                    def s = (xmlLine =~ /skipped="(\\d+)"/)

                    if (t) total = t[0][1] as int
                    if (f) failures = f[0][1] as int
                    if (s) skipped = s[0][1] as int

                    passed = total - failures - skipped
                    if (passed < 0) passed = 0
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
                    to: committer,
                    subject: "Build ${currentBuild.result}: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: emailBody,
                    attachLog: true,
                    attachmentsPattern: 'selenium-tests/report.html'
                )
            }

            // Always cleanup
            sh '$COMPOSE down || true'
        }
    }
}
