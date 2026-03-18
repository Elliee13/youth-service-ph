import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { Container } from "../components/ui/Container";
import { Button } from "../components/ui/Button";
import { useGsapReveal } from "../hooks/useGsapReveal";
import { useRef } from "react";
import yspMap from "../assets/ysp-map.jpg";
import citizenshipGovernanceImage from "../assets/citizenship&governance.jpg";
import ecologicalSustainabilityImage from "../assets/ecologicalSustainability.jpg";
import humanitarianServiceImage from "../assets/humanitarianService.jpg";
import learningDevelopmentImage from "../assets/learning&Development.jpg";

const whatWeDo = [
  {
    title: "Community Service Projects",
    copy:
      "We organize practical community-based projects that respond to local needs through service, coordination, and sustained youth participation.",
  },
  {
    title: "Youth Leadership Development",
    copy:
      "We create spaces for young people to lead teams, build initiatives, and grow their capacity to organize meaningful action.",
  },
  {
    title: "Advocacy and Awareness",
    copy:
      "We promote civic responsibility and issue-based engagement through campaigns, education, and youth-led awareness efforts.",
  },
  {
    title: "Chapter Expansion and Local Engagement",
    copy:
      "We strengthen local leadership by building chapters that bring volunteerism, advocacy, and service closer to communities.",
  },
] as const;

const pillars = [
  {
    title: "Citizenship & Governance",
    image: citizenshipGovernanceImage,
  },
  {
    title: "Ecological Sustainability",
    image: ecologicalSustainabilityImage,
  },
  {
    title: "Learning & Development",
    image: learningDevelopmentImage,
  },
  {
    title: "Humanitarian Service",
    image: humanitarianServiceImage,
  },
] as const;

const programs = [
  {
    title: "Project Indigo",
    copy:
      "Project Indigo supports peace education, health awareness, and community empowerment in Indigenous Peoples communities.",
  },
  {
    title: "Tabang Ta Bai",
    copy:
      "Tabang Ta Bai is a donation and relief initiative delivering practical aid to communities affected by crisis and hardship.",
  },
] as const;

export default function About() {
  const scope = useRef<HTMLDivElement | null>(null);
  useGsapReveal(scope);

  return (
    <div ref={scope}>
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.00),rgba(255,255,255,0.92))]" />
        </div>

        <Container>
          <div className="max-w-4xl">
            <div
              data-reveal
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45"
            >
              About
            </div>
            <h1
              data-reveal
              className="mt-4 [font-family:var(--font-display)] text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl"
            >
              About Youth Service Philippines
            </h1>
            <p
              data-reveal
              className="mt-5 max-w-3xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
            >
              Youth Service Philippines empowers young Filipinos to lead through service,
              community action, and nation-building.
            </p>
            <p
              data-reveal
              className="mt-5 max-w-3xl text-[15px] leading-7 text-black/65 sm:text-lg sm:leading-8"
            >
              Youth Service Philippines is a youth-led organization committed to building a
              culture of service, leadership, and civic responsibility across the Philippines.
              Through local chapters, national initiatives, and community-based programs, we
              create opportunities for young people to contribute meaningfully to society while
              growing as leaders.
            </p>

            <div data-reveal className="mt-8 flex flex-wrap gap-3">
              <Link to="/programs">
                <Button size="lg" className="accent-glow">
                  Explore Programs
                </Button>
              </Link>
              <Link to="/membership-and-chapter">
                <Button size="lg" variant="secondary">
                  Lead a Chapter
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Section
        eyebrow="Who We Are"
        title="A youth-led movement rooted in service and action"
        description="Youth Service Philippines is a movement of young Filipinos working together to serve communities, respond to real social needs, and inspire action through leadership."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-reveal className="border-black/10 bg-white/80 p-6 sm:p-8">
            <p className="text-sm leading-7 text-black/65 sm:text-base">
              We believe that the Filipino youth are not only the future, but also active
              changemakers of the present.
            </p>
          </Card>
          <Card data-reveal className="border-black/10 bg-[rgb(var(--card))] p-6 sm:p-8">
            <p className="text-sm leading-7 text-black/65 sm:text-base">
              Our work connects local action with national purpose. Through chapters, initiatives,
              and volunteer opportunities, we help turn compassion into organized service.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        eyebrow="Mission and Vision"
        title="Our Mission and Vision"
        description="A clear direction for how youth leadership, civic responsibility, and organized service come together."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card data-reveal className="border-black/10 bg-white p-6 sm:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Mission
            </div>
            <p className="mt-4 text-sm leading-7 text-black/65 sm:text-base">
              To empower Filipino youth through service, leadership, and collective action by
              creating programs, opportunities, and local chapters that respond to community needs
              and national realities.
            </p>
          </Card>
          <Card data-reveal className="border-black/10 bg-[rgb(var(--card))] p-6 sm:p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/45">
              Vision
            </div>
            <p className="mt-4 text-sm leading-7 text-black/65 sm:text-base">
              A Philippines where young people are actively engaged in building stronger
              communities, advancing civic responsibility, and leading meaningful change through
              service.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        eyebrow="What We Do"
        title="Youth-led action built around real community needs"
        description="We organize youth-led action through chapters, programs, and advocacy-driven initiatives that address real needs in communities across the country."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {whatWeDo.map((item) => (
            <Card
              key={item.title}
              data-reveal
              className="border-black/10 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]"
            >
              <div className="text-base font-semibold">{item.title}</div>
              <p className="mt-3 text-sm leading-6 text-black/65">{item.copy}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Advocacy"
        title="Our Advocacy Pillars"
        description="These focus areas help guide how we serve, organize, and build programs with lasting relevance."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <Card
              key={pillar.title}
              data-reveal
              className="bg-white/75 p-6 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(2,6,23,0.10)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[rgb(var(--card))]">
                <img
                  src={pillar.image}
                  alt={pillar.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mt-4 text-sm font-semibold leading-6">{pillar.title}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Nationwide Presence"
        title="Our Reach Across the Philippines"
        description="Youth Service Philippines continues to grow through local chapters, community-driven initiatives, and youth-led action across multiple regions nationwide."
      >
        <div className="grid gap-6">
          <div data-reveal className="mx-auto w-full max-w-4xl">
            <img
              src={yspMap}
              alt="Youth Service Philippines reach map showing chapters and impact across the Philippines."
              className="h-auto w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>

          <p
            data-reveal
            className="max-w-3xl text-sm leading-7 text-black/65 sm:text-base"
          >
            Our expanding network allows us to bring service, leadership, and advocacy closer to
            communities while staying connected to a shared national mission.
          </p>
        </div>
      </Section>

      <Section
        eyebrow="Programs"
        title="Key Programs and Initiatives"
        description="These initiatives reflect how Youth Service Philippines turns advocacy into concrete work on the ground."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {programs.map((program) => (
            <Card key={program.title} data-reveal className="border-black/10 bg-white p-6 sm:p-8">
              <div className="text-base font-semibold">{program.title}</div>
              <p className="mt-3 text-sm leading-7 text-black/65 sm:text-base">{program.copy}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        eyebrow="Leadership"
        title="Lead a Chapter in Your Community"
        description="As our network continues to grow, we are looking for young leaders who are ready to organize, serve, and represent Youth Service Philippines in their local area."
      >
        <Card
          data-reveal
          className="border-black/10 bg-[rgb(var(--card))] p-8 sm:p-10"
        >
          <p className="max-w-3xl text-sm leading-7 text-black/65 sm:text-base">
            Chapter leadership is an opportunity to help bring programs, volunteerism, and
            advocacy into your community.
          </p>
          <div className="mt-6">
            <Link to="/membership-and-chapter">
              <Button size="lg" className="accent-glow">
                Become a Chapter Lead
              </Button>
            </Link>
          </div>
        </Card>
      </Section>

      <Section
        eyebrow="Join"
        title="Join the Movement"
        description="Whether you want to volunteer, join a chapter, support an initiative, or lead in your community, there is a place for you in Youth Service Philippines."
      >
        <div
          data-reveal
          className="rounded-3xl border border-black/10 bg-white p-8 sm:p-10"
        >
          <div className="flex flex-wrap gap-3">
            <Link to="/volunteer-opportunities">
              <Button size="lg" className="accent-glow">
                Browse Opportunities
              </Button>
            </Link>
            <Link to="/programs">
              <Button size="lg" variant="secondary">
                Explore Programs
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="secondary">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
