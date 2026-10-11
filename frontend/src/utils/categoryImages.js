// src/utils/categoryImages.js
/**
 * Curated high-resolution photography and theme colors for SkillSphere categories.
 * Provides resilient image fallbacks so workshop cards and detail pages
 * always display crisp, realistic educational photography instead of emoji placeholders.
 */

export const CATEGORY_METADATA = {
  Programming: {
    label: "Programming & Code",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
    accent: "#6366f1",
  },
  Design: {
    label: "UI/UX & Visual Design",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #2e1065 0%, #581c87 100%)",
    accent: "#a855f7",
  },
  Business: {
    label: "Business & Strategy",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    accent: "#3b82f6",
  },
  Marketing: {
    label: "Growth & Marketing",
    image: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #3b0764 0%, #701a75 100%)",
    accent: "#ec4899",
  },
  Music: {
    label: "Music & Production",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
    accent: "#f43f5e",
  },
  Photography: {
    label: "Photography & Video",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    accent: "#06b6d4",
  },
  Health: {
    label: "Health & Fitness",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    accent: "#10b981",
  },
  Cooking: {
    label: "Culinary Arts",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #451a03 0%, #78350f 100%)",
    accent: "#f59e0b",
  },
  Language: {
    label: "Languages & Culture",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #172554 0%, #1e3a8a 100%)",
    accent: "#38bdf8",
  },
  Finance: {
    label: "Finance & Investing",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    accent: "#14b8a6",
  },
  Science: {
    label: "Science & Engineering",
    image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    accent: "#8b5cf6",
  },
  Art: {
    label: "Fine Arts & Illustration",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #371b58 0%, #4c2b7a 100%)",
    accent: "#d946ef",
  },
  "Artificial Intelligence": {
    label: "AI & Machine Learning",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
    accent: "#6366f1",
  },
  "Web Development": {
    label: "Web Development",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    accent: "#4f46e5",
  },
  "Mobile Apps": {
    label: "Mobile Apps",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)",
    accent: "#6366f1",
  },
  "Game Development": {
    label: "Game Development",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
    accent: "#8b5cf6",
  },
  Cybersecurity: {
    label: "Cybersecurity",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #022c22 0%, #064e3b 100%)",
    accent: "#10b981",
  },
  "Database & Cloud": {
    label: "Cloud & Databases",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #0b1329 0%, #1e293b 100%)",
    accent: "#38bdf8",
  },
  "Content & Writing": {
    label: "Content & Writing",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80",
    gradient: "linear-gradient(135deg, #1c1917 0%, #292524 100%)",
    accent: "#f59e0b",
  },
};

/**
 * Returns a reliable image URL for a given workshop or category.
 * If workshop already has an image_url, returns that.
 * Otherwise returns the curated high-res category photo.
 */
export function getWorkshopImage(category, providedUrl) {
  if (providedUrl && typeof providedUrl === "string" && providedUrl.trim().length > 0) {
    return providedUrl;
  }
  const meta = CATEGORY_METADATA[category] || CATEGORY_METADATA.Programming;
  return meta.image;
}

export function getCategoryAccent(category) {
  return CATEGORY_METADATA[category]?.accent || "#4f46e5";
}
