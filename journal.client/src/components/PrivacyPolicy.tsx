import './PrivacyPolicy.css';

interface PrivacyPolicyProps {
    onBack?: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
    return (
        <div className="privacy-policy">
            <h1>Privacy Policy & Data Handling</h1>
            
            <div className="highlight-box">
                <strong>Transparency First:</strong> This application is in active development. By using this application, 
                you acknowledge that as the developer, I have technical access to all stored data, including your journal entries. 
                However, I am committed to respecting your privacy and only accessing data when necessary for debugging or 
                improving the service.
            </div>

            <h2>Data Collection</h2>
            <p>
                Inside Journaling App collects and stores the following information:
            </p>
            <ul>
                <li><strong>Authentication Data:</strong> Your Google account email, name, and profile picture</li>
                <li><strong>Journal Entries:</strong> Your written journal entries, including text content and timestamps</li>
                <li><strong>Voice Recordings:</strong> Audio files if you use the voice recording feature (stored separately from text)</li>
                <li><strong>Analysis Data:</strong> AI-generated sentiment scores, key phrases, summaries, and affirmations based on your entries</li>
                <li><strong>Usage Data:</strong> Login times, writing streak information, and feature usage patterns</li>
            </ul>

            <h2>How Your Data is Stored</h2>
            <p>
                All data is stored securely in Microsoft Azure cloud services in the United States:
            </p>
            <ul>
                <li><strong>Azure Cosmos DB:</strong> Stores your journal entries, user profile, and AI analysis results with encryption at rest</li>
                <li><strong>Azure Blob Storage:</strong> Stores voice recording audio files with private access only</li>
                <li><strong>Azure App Configuration:</strong> Stores application settings only (no personal data)</li>
            </ul>
            <p>
                All connections use HTTPS encryption to protect data in transit.
            </p>

            <h2>Data Access & Privacy</h2>
            
            <h3>Developer Access - My Commitment to You</h3>
            <div className="highlight-box">
                <strong>Here's the truth:</strong> As the sole developer of this application, I have technical access to the 
                Azure resources where your data is stored. This means I <em>could</em> technically view your journal entries 
                and personal information. <strong>However, I am making a clear commitment: I do not actively monitor, read, 
                or browse through user journal entries or personal information.</strong> Your privacy matters to me, and I 
                respect the personal nature of your journal.
            </div>

            <h3>When I May Access Your Data:</h3>
            <ul>
                <li>
                    <strong>Bug Fixes & Troubleshooting:</strong> If you report a problem or if I detect an error in the system logs, 
                    I may need to review your specific data to understand what went wrong. I will only access the minimum data 
                    necessary to diagnose and fix the issue.
                </li>
                <li>
                    <strong>Security Incidents:</strong> In the unlikely event of a security breach or if I detect suspicious activity 
                    that could affect your account, I may review data to protect your information and system integrity.
                </li>
                <li>
                    <strong>Service Improvements:</strong> I may review anonymous, aggregated patterns (not individual entries) to improve 
                    features like sentiment analysis accuracy or to understand how features are being used.
                </li>
            </ul>

            <h3>What I Don't Do:</h3>
            <ul>
                <li>❌ Browse or read journal entries out of curiosity or for personal interest</li>
                <li>❌ Share your personal data with any third parties (except the Azure infrastructure providers)</li>
                <li>❌ Use your journal content for training AI models or any purpose other than providing this service</li>
                <li>❌ Sell, rent, or monetize your personal information in any way</li>
                <li>❌ Monitor your activity or track what you write about</li>
            </ul>

            <h3>Your Rights & Controls</h3>
            <p>You maintain full control over your data:</p>
            <ul>
                <li><strong>View Everything:</strong> All your data is visible to you in the app</li>
                <li><strong>Edit Anytime:</strong> You can edit or delete individual journal entries at any time</li>
                <li><strong>Export Your Data:</strong> Use the export feature to download all your journal entries in JSON or CSV format</li>
                <li><strong>Request Deletion:</strong> Contact me to request complete account and data deletion</li>
            </ul>

            <h2>Third-Party Services</h2>
            <p>
                This application uses the following third-party services that process your data:
            </p>
            <ul>
                <li>
                    <strong>Google Authentication:</strong> Your Google account is used only for authentication (sign-in). 
                    We receive and store your email, name, and profile picture URL from Google. We do not have access to your 
                    Google password or any other Google account information. Google's privacy policy applies during the 
                    authentication process.
                </li>
                <li>
                    <strong>Azure OpenAI Service:</strong> Your journal entry text is sent to Microsoft's Azure OpenAI service 
                    for sentiment analysis, summarization, and generating personalized affirmations. Microsoft processes this 
                    data according to their Azure OpenAI data privacy policies. The data is not used to train OpenAI models.
                </li>
                <li>
                    <strong>Azure Cognitive Services (Speech & Text Analytics):</strong> Used for speech-to-text transcription 
                    of voice recordings and text analysis for key phrase extraction. Processed according to Microsoft's 
                    privacy policies.
                </li>
            </ul>
            <p>
                <strong>Important:</strong> All of these services process your data in accordance with Microsoft's and Google's 
                enterprise privacy policies. Your data is not used to train public AI models.
            </p>

            <h2>Data Retention & Deletion</h2>
            <p>
                Your data is retained as long as your account is active. You have full control:
            </p>
            <ul>
                <li><strong>Delete Individual Entries:</strong> You can delete any journal entry at any time from the app</li>
                <li><strong>Edit Your Content:</strong> All entries can be edited after creation</li>
                <li><strong>Export Everything:</strong> Download all your data in portable formats (JSON/CSV)</li>
                <li><strong>Complete Account Deletion:</strong> Contact me to request full account deletion. I will permanently 
                    delete all your data from all Azure services within 30 days.</li>
            </ul>
            <p>
                <strong>Note:</strong> Deletion is permanent and cannot be undone. Make sure to export your data if you want 
                to keep a copy before requesting deletion.
            </p>

            <h2>Security Measures</h2>
            <p>
                I take the security of your data seriously. Here are the measures in place:
            </p>
            <ul>
                <li><strong>Encryption in Transit:</strong> All data is transmitted over encrypted HTTPS connections</li>
                <li><strong>Encryption at Rest:</strong> Azure Cosmos DB and Blob Storage use encryption for stored data</li>
                <li><strong>Secure Authentication:</strong> Industry-standard OAuth 2.0 with Google (no passwords stored)</li>
                <li><strong>Azure Security:</strong> All services follow Microsoft's enterprise-grade security standards</li>
                <li><strong>Access Control:</strong> Backend systems require multi-factor authentication to access</li>
                <li><strong>Regular Updates:</strong> Dependencies and security patches are kept up to date</li>
            </ul>
            <p>
                <strong>Note:</strong> While I implement industry-standard security practices, no system is 100% secure. 
                Please don't write anything you wouldn't want to risk being exposed in a worst-case security breach scenario.
            </p>

            <h2>Crisis Detection & Mental Health Resources</h2>
            <p>
                This app includes an AI-powered crisis detection feature that analyzes journal entries for signs of 
                emotional distress or crisis situations. When concerning content is detected:
            </p>
            <ul>
                <li>The app displays mental health crisis resources and hotlines</li>
                <li>A visual alert appears with immediate access to help</li>
                <li>This is done automatically by AI - no human reviews your entries for this purpose</li>
            </ul>
            <p className="highlight-box">
                <strong>Critical Disclaimer:</strong> This feature is NOT a substitute for professional mental health care. 
                If you're experiencing a mental health crisis, suicidal thoughts, or need immediate help, please:
                <br /><br />
                🆘 <strong>Call 988 (Suicide & Crisis Lifeline)</strong> - Available 24/7 in the US
                <br />
                🆘 <strong>Text "HELLO" to 741741 (Crisis Text Line)</strong> - Free 24/7 support
                <br />
                🆘 <strong>Call 911</strong> or go to your nearest emergency room for immediate danger
            </p>

            <h2>Children's Privacy</h2>
            <p>
                This application is not intended for children under 13 years of age. I do not knowingly collect personal 
                information from children under 13. If you are a parent or guardian and believe your child has provided 
                personal information, please contact me to have it removed.
            </p>

            <h2>Changes to This Privacy Policy</h2>
            <p>
                I may update this privacy policy as the application evolves or as required by law. When significant changes 
                are made, I will:
            </p>
            <ul>
                <li>Update the "Last Updated" date below</li>
                <li>Notify users through the application or via email</li>
                <li>Provide a summary of material changes</li>
            </ul>
            <p>
                Continued use of the application after changes constitutes acceptance of the updated privacy policy.
            </p>

            <h2>Contact & Questions</h2>
            <p>
                If you have questions, concerns, or requests regarding this privacy policy or how your data is handled:
            </p>
            <ul>
                <li><strong>For data deletion requests:</strong> Contact me with your account email</li>
                <li><strong>For privacy questions:</strong> Ask about specific data practices</li>
                <li><strong>For security concerns:</strong> Report any security issues immediately</li>
                <li><strong>For technical issues:</strong> Get help with bugs or problems</li>
            </ul>
            <p>
                <strong>Contact Information:</strong><br />
                <strong>Email:</strong> [savagececily@gmail.com]<br />
                <strong>GitHub:</strong> <a href="https://github.com/savagececily/Journal" target="_blank" rel="noopener noreferrer">
                    github.com/savagececily/Journal
                </a>
            </p>

            <div className="last-updated">
                Last Updated: May 1, 2026
            </div>

            {onBack && (
                <button className="back-button" onClick={onBack}>
                    ← Back to Login
                </button>
            )}
        </div>
    );
}
