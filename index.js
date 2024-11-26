const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");

class LegalCaseAnalyzer {
    constructor() {
        // Replace with your actual API key
        const apiKey = 'AIzaSyAwXkzu7QNyOjPx2oIDbIHWVKBaCH1B_po';
        
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY environment variable not set');
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelFlash = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async analyzeCase(caseDescription) {
        const prompt = `You are a seasoned legal expert tasked with providing an extensive, structured breakdown of arguments for both the plaintiff's and the defendant's advocates in a high level of debate between 2 senior lawyer in high court, and provided section in both ipc and bns. This analysis should be detailed, using legal reasoning suitable for those without legal representation, and should provide insightful guidance.

For 3 round of argument between the plaintiff's and the defendant's advocates, provide the following structured details for each side in at least 5 points for each structured detail, specially for supporting evidence and section and act:

1. **Legal Claims and Defenses**:
   - Outline the primary legal claims, defenses, and rights each side is asserting.
   - Reference relevant acts, laws, and sections that support each argument.
   - Ensure each claim or defense is well-explained to clarify its legal standing.

2. **Supporting Evidence and its Relevance**:
   - List and describe specific types of evidence (e.g., witness testimony, physical evidence, digital records) that support each claim or defense.
   - Explain how each piece of evidence strengthens the advocate's position and its potential impact on the court's perspective.

3. **Landmark Judgments and Precedents**:
   - Include 5-8 high-profile judgments and legal precedents from similar cases.
   - For each precedent, provide a brief summary and explain its relevance to the current case.
   - Discuss how these judgments support the advocate's argument or establish a relevant legal principle.

4. **Counterarguments and Rebuttals**:
   - Respond directly to the opposing advocate's points, addressing weaknesses or inconsistencies in their claims.
   - Use legal principles or evidence to counter the other side's arguments effectively.

5. **Potential Legal Outcomes and Consequences**:
   - Describe the legal consequences and possible outcomes if each side's arguments are upheld.
   - Discuss both immediate legal implications (e.g., penalties, fines) and long-term consequences (e.g., criminal records, civil liabilities).

Each advocate should respond directly to the previous argument made by the opposing side, attempting to refute or strengthen their case with additional points. Ensure that each round of argument is detailed, precise, and labeled clearly.

Case Description:
${caseDescription}

Please ensure the analysis is comprehensive and structured, offering a full view of the strengths and weaknesses of each side's case through a high level of debate between 2 senior lawyer in high court. Present the arguments in a way that is both educational and actionable for someone without legal representation.`;

        try {
            const responseFlash = await this.modelFlash.generateContent(prompt);

            return {
                success: true,
                flashAnalysis: responseFlash.response.text()
            };
        } catch (error) {
            console.error('Analysis Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize the analyzer
let analyzer;
try {
    analyzer = new LegalCaseAnalyzer();
} catch (error) {
    console.error('Analyzer Initialization Error:', error);
    process.exit(1);
}

// Health Check Route
app.get('/', (req, res) => {
    res.json({ status: 'healthy' });
});


// Point-wise Analysis Route
app.post('/api/point-analyze', async (req, res) => {
    const { caseDescription } = req.body;

    if (!caseDescription) {
        return res.status(400).json({
            success: false,
            error: 'Case description is required'
        });
    }

    try {
        const result = await analyzer.analyzeCase(caseDescription);

        if (!result.success) {
            return res.status(500).json(result);
        }

        // Helper function to convert text to point-wise format
        const formatIntoPoints = (text) => {
            return text
                .split('\n')
                .filter(line => line.trim() !== '')
                .map((line, index) => `${index + 1}. ${line.trim()}`)
                .join('\n');
        };

        const pointFormattedResponse = {
            success: result.success,
            pointFormattedFlashAnalysis: formatIntoPoints(result.flashAnalysis)
        };

        res.json(pointFormattedResponse);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For potential testing
