import './About.css';

interface AboutProps {
    onClose: () => void;
}

function About({ onClose }: AboutProps) {
    return (
        <div className="about-overlay" onClick={onClose}>
            <div className="about-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>✕</button>
                
                <div className="about-content">
                    <h1>🌱 Inside Journal</h1>
                    <p className="version">Version 1.0.0</p>
                    
                    <div className="about-section">
                        <h2>About</h2>
                        <p>
                            Inside Journaling App is your personal space for reflection and growth. 
                            We believe that understanding your emotions is the first step toward living a more mindful, 
                            intentional life. Our app helps you explore your thoughts and discover patterns in your 
                            emotional well-being.
                        </p>
                        <p>
                            Each journal entry you create is thoughtfully analyzed to help you understand your emotional 
                            state, identify recurring themes, and receive personalized encouragement. Track your progress 
                            over time and gain valuable insights into your personal journey.
                        </p>
                    </div>

                    <div className="about-section">
                        <h2>Features</h2>
                        <ul className="features-list">
                            <li>Emotional tone analysis that helps you understand your feelings</li>
                            <li>Automatic theme identification to spot patterns in your thoughts</li>
                            <li>Personalized affirmations and encouraging insights</li>
                            <li>Secure, private storage for all your journal entries</li>
                            <li>Voice journaling for hands-free convenience</li>
                            <li>Visual trend tracking to see your emotional patterns</li>
                            <li>Export your data anytime - you own your content</li>
                            <li>Privacy-focused design with enterprise-grade security</li>
                        </ul>
                    </div>

                    <div className="about-section">
                        <h2>Your Privacy Matters</h2>
                        <p>
                            Your journal is your private space. All entries are encrypted and stored securely. 
                            We never share your personal thoughts with third parties, use your data for advertising, 
                            or train AI models on your private journal content. You can export or delete your 
                            data at any time.
                        </p>
                    </div>

                    <div className="about-section">
                        <h2>Getting Started</h2>
                        <p>
                            Simply write your thoughts in the journal entry box and click "Save & Analyze Entry". 
                            You'll receive insights about your emotional tone, recurring themes, and a personalized 
                            affirmation. Over time, you'll see visual trends that help you understand your emotional 
                            patterns and personal growth journey.
                        </p>
                    </div>

                    <div className="about-section">
                        <p className="contact-info">
                            © 2026 Inside Journaling App. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;
