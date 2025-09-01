import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  tutorialSidebar: [
    "intro",
    {
      type: "category",
      label: "Project Overview",
      items: [
        "overview/executive-summary",
        "overview/inspiration",
        "overview/the-problem",
        "overview/the-solution",
        "overview/product-overview",
      ],
    },
    {
      type: "category",
      label: "Platform Features",
      items: [
        "overview/core-features",
        "overview/expert-publications",
        "overview/medical-infts",
        "overview/target-users",
        "overview/jeff-story",
      ],
    },
    {
      type: "category",
      label: "Technical Details",
      items: [
        "overview/technical-architecture",
        "overview/0g-integration-highlights",
        "overview/medical-infts",
        "overview/tokenization-model",
      ],
    },
    {
      type: "category",
      label: "Development",
      items: [
        "overview/roadmap",
        "overview/wave-2",
        "overview/weekly",
        "overview/innovation-impact",
        "overview/team",
      ],
    },
    {
      type: "category",
      label: "Resources",
      items: ["overview/additional-links"],
    },
  ],
};

export default sidebars;
