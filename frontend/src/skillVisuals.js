export const skillVisuals = {
  Python: { icon: "🐍", className: "skill-purple" },
  Django: { icon: "🌿", className: "skill-green" },
  React: { icon: "⚛️", className: "skill-cyan" },
  JavaScript: { icon: "✨", className: "skill-yellow" },
  "HTML & CSS": { icon: "🧩", className: "skill-orange" },
  SQL: { icon: "🗃️", className: "skill-blue" },
  "Git & GitHub": { icon: "🐙", className: "skill-dark" },
  Photography: { icon: "📸", className: "skill-orange" },
  "Graphic Design": { icon: "🎨", className: "skill-pink" },
  "Video Editing": { icon: "🎬", className: "skill-blue" },
  "UI/UX Design": { icon: "✦", className: "skill-pink" },
  Drawing: { icon: "✏️", className: "skill-yellow" },
  English: { icon: "🇬🇧", className: "skill-blue" },
  Swahili: { icon: "🌍", className: "skill-green" },
  French: { icon: "🇫🇷", className: "skill-blue" },
  Spanish: { icon: "🇪🇸", className: "skill-yellow" },
  Guitar: { icon: "🎸", className: "skill-purple" },
  Piano: { icon: "🎹", className: "skill-dark" },
  Singing: { icon: "🎤", className: "skill-pink" },
  "Digital Marketing": { icon: "📣", className: "skill-orange" },
  "Public Speaking": { icon: "🎙️", className: "skill-purple" },
  Excel: { icon: "📊", className: "skill-green" },
  Entrepreneurship: { icon: "🚀", className: "skill-orange" },
  Cooking: { icon: "🍳", className: "skill-yellow" },
  Fitness: { icon: "💪", className: "skill-green" },
  Baking: { icon: "🧁", className: "skill-pink" },
  "Personal Styling": { icon: "✨", className: "skill-purple" },
};

export function getSkillVisual(skillName="Skill") {
  return skillVisuals[skillName] || { icon: "✦", className: "skill-purple" };
}
