'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './education.module.css';

const TOPICS = [
  {
    category: 'Understanding Recovery',
    icon: '🧠',
    items: [
      'What are the stages of recovery from substance use?',
      'How does addiction affect the brain?',
      'What is the difference between physical and psychological dependence?',
    ],
  },
  {
    category: 'Coping Strategies',
    icon: '💪',
    items: [
      'Evidence-based coping strategies for cravings',
      'Mindfulness and meditation techniques for recovery',
      'How to build a healthy daily routine in recovery',
    ],
  },
  {
    category: 'Prevention & Wellness',
    icon: '🛡️',
    items: [
      'Recognizing early warning signs of relapse',
      'The role of nutrition and exercise in recovery',
      'Building a strong support network',
    ],
  },
];

export default function EducationPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
  }, [user, loading, router]);

  async function generateContent(topic) {
    setSelectedTopic(topic);
    setContent('');
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          stage: profile?.recoveryStage || 'general',
        }),
      });

      if (!res.ok) throw new Error('Failed to generate content');

      const data = await res.json();
      setContent(data.content);
    } catch (err) {
      console.error('Education error:', err);
      setContent(
        'Sorry, we could not generate this content right now. Please try again. If you need immediate support, call 988.'
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCustomSearch(e) {
    e.preventDefault();
    if (customTopic.trim()) {
      generateContent(customTopic.trim());
      setCustomTopic('');
    }
  }

  // Simple markdown-to-html for bold, headers, bullets
  function renderContent(text) {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith('# '))
        return <h2 key={i} className={styles.contentH2}>{trimmed.slice(2)}</h2>;
      if (trimmed.startsWith('## '))
        return <h3 key={i} className={styles.contentH3}>{trimmed.slice(3)}</h3>;
      if (trimmed.startsWith('### '))
        return <h4 key={i} className={styles.contentH4}>{trimmed.slice(4)}</h4>;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* '))
        return (
          <li key={i} className={styles.contentLi}>
            {renderInline(trimmed.slice(2))}
          </li>
        );
      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={i} className={styles.contentLi}>
            {renderInline(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      return <p key={i} className={styles.contentP}>{renderInline(trimmed)}</p>;
    });
  }

  function renderInline(text) {
    // Handle **bold**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  if (loading || !user) {
    return (
      <div className="flex flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className={`page-content ${styles.education}`}>
      <div className="container">
        <header className={`${styles.header} animate-fade-in`}>
          <h1>📚 Learn & Grow</h1>
          <p>
            AI-generated educational resources tailored to your recovery journey.
            Select a topic or ask your own question.
          </p>
        </header>

        {/* Custom topic search */}
        <form
          onSubmit={handleCustomSearch}
          className={`${styles.searchForm} animate-fade-in-up`}
        >
          <input
            type="text"
            className="input"
            placeholder="Ask about any recovery topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            aria-label="Search for a recovery topic"
            id="education-search"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!customTopic.trim() || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </form>

        <div className={styles.layout}>
          {/* Topic sidebar */}
          <aside className={styles.sidebar}>
            {TOPICS.map((category) => (
              <div key={category.category} className={styles.categoryGroup}>
                <h3 className={styles.categoryTitle}>
                  <span>{category.icon}</span> {category.category}
                </h3>
                <div className={styles.topicList}>
                  {category.items.map((topic) => (
                    <button
                      key={topic}
                      className={`${styles.topicBtn} ${
                        selectedTopic === topic ? styles.activeTopic : ''
                      }`}
                      onClick={() => generateContent(topic)}
                      disabled={isGenerating}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Content area */}
          <main className={styles.contentArea}>
            {!selectedTopic && !content && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📖</span>
                <h2>Select a topic to learn about</h2>
                <p>
                  Choose from the categories on the left, or search for your own
                  topic above. All content is generated by AI in real-time.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className={styles.generating}>
                <div className="spinner spinner-lg" />
                <p>Generating personalized content...</p>
              </div>
            )}

            {content && !isGenerating && (
              <article className={`card ${styles.article} animate-fade-in`}>
                <div className={styles.articleHeader}>
                  <span className="badge badge-primary">AI Generated</span>
                  <h2 className={styles.articleTitle}>{selectedTopic}</h2>
                </div>
                <div className={styles.articleBody}>{renderContent(content)}</div>
                <div className={styles.articleFooter}>
                  <p>
                    ℹ️ This content is AI-generated for educational purposes.
                    Always consult healthcare professionals for medical advice.
                  </p>
                </div>
              </article>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
