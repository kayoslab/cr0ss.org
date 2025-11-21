interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "Tell me something about composable commerce",
  "What is your take on the job of an Architect",
  "What is your professional background",
];

export function SuggestedQuestions({ onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-col space-y-2 w-full max-w-2xl">
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          onClick={() => onQuestionClick(question)}
          className="px-4 py-3 text-left bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors text-gray-900"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
