import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import type { QuestionType } from '../../lib/database.types';

interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  placeholder: string;
  options: string[];
  display_order: number;
}

interface CustomQuestionsBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export default function CustomQuestionsBuilder({ questions, onChange }: CustomQuestionsBuilderProps) {
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    question_text: '',
    question_type: 'text',
    is_required: true,
    placeholder: '',
    options: [],
  });

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'text', label: 'Short Answer' },
    { value: 'textarea', label: 'Paragraph' },
    { value: 'number', label: 'Number' },
    { value: 'file', label: 'File Upload' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'radio', label: 'Multiple Choice' },
  ];

  const addQuestion = () => {
    if (!newQuestion.question_text?.trim()) return;

    const question: Question = {
      id: Date.now().toString(),
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type || 'text',
      is_required: newQuestion.is_required ?? true,
      placeholder: newQuestion.placeholder || '',
      options: newQuestion.options || [],
      display_order: questions.length,
    };

    onChange([...questions, question]);
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      is_required: true,
      placeholder: '',
      options: [],
    });
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    } else if (direction === 'down' && index < questions.length - 1) {
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    }
    // Update display_order
    newQuestions.forEach((q, i) => (q.display_order = i));
    onChange(newQuestions);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const option = prompt('Enter option:');
    if (option && option.trim()) {
      updateQuestion(questionId, { options: [...(question.options || []), option.trim()] });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newOptions = [...(question.options || [])];
    newOptions.splice(optionIndex, 1);
    updateQuestion(questionId, { options: newOptions });
  };

  return (
    <div className="space-y-4">
      {/* Existing Questions */}
      {questions.map((question, index) => (
        <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="w-5 h-5 text-gray-400 cursor-move hidden sm:block" />
              <input
                type="text"
                value={question.question_text}
                onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Question text"
              />
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => moveQuestion(index, 'up')}
                disabled={index === 0}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => moveQuestion(index, 'down')}
                disabled={index === questions.length - 1}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeQuestion(question.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Delete question"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-0 sm:ml-7">
            <select
              value={question.question_type}
              onChange={(e) => updateQuestion(question.id, { question_type: e.target.value as QuestionType })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={question.is_required}
                  onChange={(e) => updateQuestion(question.id, { is_required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>

              <input
                type="text"
                value={question.placeholder || ''}
                onChange={(e) => updateQuestion(question.id, { placeholder: e.target.value })}
                placeholder="Placeholder"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Options for dropdown/radio */}
          {(question.question_type === 'dropdown' || question.question_type === 'radio') && (
            <div className="mt-3 ml-0 sm:ml-7">
              <label className="text-sm font-medium text-gray-700">Options</label>
              <div className="space-y-2 mt-2">
                {question.options?.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <span className="text-sm bg-gray-100 px-3 py-1 rounded-lg flex-1">{option}</span>
                    <button
                      onClick={() => removeOption(question.id, optIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addOption(question.id)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add New Question */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <div className="space-y-3">
          <input
            type="text"
            value={newQuestion.question_text}
            onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
            placeholder="Enter your question"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={newQuestion.question_type}
              onChange={(e) => setNewQuestion({ ...newQuestion, question_type: e.target.value as QuestionType })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newQuestion.is_required}
                  onChange={(e) => setNewQuestion({ ...newQuestion, is_required: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>

              <input
                type="text"
                value={newQuestion.placeholder || ''}
                onChange={(e) => setNewQuestion({ ...newQuestion, placeholder: e.target.value })}
                placeholder="Placeholder"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <button
            onClick={addQuestion}
            disabled={!newQuestion.question_text?.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>
    </div>
  );
}