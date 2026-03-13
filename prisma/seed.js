const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  // ── Admin user ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("Mpange2026", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@mpange.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@mpange.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", admin.email);

  // ── Site Content ───────────────────────────────────────
  const sections = [
    {
      section: "hero",
      data: {
        headline:
          "We help experience-driven companies thrive by making their audience feel the refined intricacies of their brand and product.",
        imageUrl: "",
        imagePublicId: "",
      },
    },
    {
      section: "news",
      data: {
        title: "Spread\nthe News",
        subtitle:
          "Find out more about our work on these leading design and technology platforms.",
      },
    },
    {
      section: "playreel",
      data: {
        caption:
          "Our work is best experienced in motion. Don't forget to put on your headphones.",
        label: "Work in motion",
      },
    },
    {
      section: "services",
      data: {
        services: [
          {
            id: "s1",
            title: "Cinema & Film",
            description:
              "Brand films, reels, and motion content that move people.",
          },
          {
            id: "s2",
            title: "Photography",
            description: "Editorial, product, and portrait photography.",
          },
          {
            id: "s3",
            title: "Web Development",
            description: "Scroll-driven, interactive web experiences.",
          },
          {
            id: "s4",
            title: "Mobile Apps",
            description: "iOS and Android apps built for real people.",
          },
        ],
      },
    },
    {
      section: "contact",
      data: {
        imageUrl: "",
        imagePubId: "",
        email: "hello@mpange.com",
        phone: "+260 972276257",
        socials: [
          {
            label: "Facebook",
            url: "https://web.facebook.com/profile.php?id=100063714974128",
          },
          {
            label: "Instagram",
            url: "https://www.instagram.com/mpange/",
          },
          {
            label: "LinkedIn",
            url: "https://www.linkedin.com/company/mpange",
          },
        ],
        budgets: [
          "Under K5k",
          "K5k – K15k",
          "K15k – K30k",
          "K30k – K60k",
          "K60k+",
        ],
      },
    },
  ];

  for (const s of sections) {
    await prisma.siteContent.upsert({
      where: { section: s.section },
      update: {},
      create: s,
    });
    console.log(`✅ Section: ${s.section}`);
  }

  // ── Sample Projects & Blogs ────────────────────────────
  const existing = await prisma.product.count();
  if (existing === 0) {
    // ── Projects ───────────────────────────────────────────
    const projects = [
      {
        title: "Luminary Brand Film",
        description:
          "A full brand film for Luminary Agency — shot across three cities, blending documentary realism with cinematic visual language. Directed, shot, and edited in-house.",
        category: "Cinema & Film",
        tags: ["Motion Picture", "2024"],
        url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=2400",
        pid: "luminary1",
      },
      {
        title: "Nour Editorial",
        description:
          "A high-fashion editorial campaign for Nour Studio, captured in natural light with minimal retouching. Twelve looks, one afternoon, zero wasted frames.",
        category: "Photography",
        tags: ["Visual Arts", "2024"],
        url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=2400",
        pid: "nour1",
      },
      {
        title: "Velour Web App",
        description:
          "A scroll-driven product showcase for Velour — built with React and GSAP. Custom cursor, parallax imagery, and a checkout flow that reduced drop-off by 34%.",
        category: "Web Development",
        tags: ["Digital Craft", "2023"],
        url: "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=2400",
        pid: "velour1",
      },
      {
        title: "Kora Mobile App",
        description:
          "End-to-end design and development of Kora — a community finance app for the Zambian market. Launched on iOS and Android with 10k users in the first month.",
        category: "Mobile Apps",
        tags: ["Digital Product", "2023"],
        url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=2400",
        pid: "kora1",
      },
      {
        title: "Soleil Portraits",
        description:
          "An ongoing portrait series exploring identity and light. Shot entirely on film, each subject was given full creative control over their representation.",
        category: "Photography",
        tags: ["Visual Arts", "2023"],
        url: "https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&q=80&w=2400",
        pid: "soleil1",
      },
    ];

    for (const p of projects) {
      await prisma.product.create({
        data: {
          title: p.title,
          description: p.description,
          category: p.category,
          tags: p.tags,
          isPublished: true,
          isFeatured: true,
          price: 0,
          userId: admin.id,
          images: { create: [{ url: p.url, publicId: p.pid }] },
        },
      });
      console.log(`✅ Project: ${p.title}`);
    }

    // ── Blogs ──────────────────────────────────────────────
    const blogs = [
      {
        title: "Behind the Lens: Zara Campaign",
        slug: "behind-the-lens-zara-campaign",
        excerpt:
          "A look inside the making of our Zara film campaign shot in Lusaka.",
        body: "Full article body goes here...",
        imageUrl:
          "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=1600",
        tags: ["Film", "Direction", "2024"],
        isPublished: true,
        authorId: admin.id,
      },
      {
        title: "Lusaka Portraits — Light & Identity",
        slug: "lusaka-portraits-light-identity",
        excerpt: "A story of light, identity and place captured in Lusaka.",
        body: "Full article body goes here...",
        imageUrl:
          "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=1600",
        tags: ["Editorial", "Photography", "2024"],
        isPublished: true,
        authorId: admin.id,
      },
      {
        title: "How We Built the Velt Studio Experience",
        slug: "how-we-built-velt-studio",
        excerpt:
          "The full story of how we designed and built the Velt digital experience.",
        body: "Full article body goes here...",
        imageUrl:
          "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&q=80&w=1600",
        tags: ["Digital", "UX", "2023"],
        isPublished: true,
        authorId: admin.id,
      },
      {
        title: "Pulse Motion — Animating a Brand",
        slug: "pulse-motion-animating-a-brand",
        excerpt:
          "How we brought the Pulse Motion brand to life through animation.",
        body: "Full article body goes here...",
        imageUrl:
          "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1600",
        tags: ["Animation", "Branding", "2023"],
        isPublished: true,
        authorId: admin.id,
      },
      {
        title: "Kente Identity — Rooted in Culture",
        slug: "kente-identity-rooted-in-culture",
        excerpt:
          "A brand identity rooted in culture, built for the modern world.",
        body: "Full article body goes here...",
        imageUrl:
          "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=1600",
        tags: ["Identity", "Culture", "2023"],
        isPublished: true,
        authorId: admin.id,
      },
    ];

    for (const blog of blogs) {
      await prisma.blog.upsert({
        where: { slug: blog.slug },
        update: {},
        create: blog,
      });
    }
    console.log("✅ Blogs seeded");
  }

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());