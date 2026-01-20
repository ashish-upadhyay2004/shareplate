import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { impactStats } from '@/data/mockData';
import heroImage from '@/assets/hero-image.jpg';
import { 
  UtensilsCrossed, 
  Truck, 
  HandHeart, 
  ArrowRight,
  Star,
  Quote,
  Leaf,
  Users,
  Heart,
  Globe,
  ChevronRight,
  MapPin,
  Clock
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: UtensilsCrossed,
      title: 'List Excess Food',
      description: 'Restaurants list surplus safe-to-eat food with details on quantity, pickup time, and location.',
    },
    {
      icon: Truck,
      title: 'NGO Requests Pickup',
      description: 'Nearby NGOs and shelters browse listings and request pickups that match their needs.',
    },
    {
      icon: HandHeart,
      title: 'Food Reaches Those in Need',
      description: 'Coordinated pickup ensures fresh food reaches communities quickly and safely.',
    },
  ];

  const testimonials = [
    {
      quote: "Share Plate has transformed how we handle excess food. Instead of waste, we now contribute to our community daily.",
      author: "Tanaka Hiroshi",
      role: "Owner, Sakura Kitchen",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
      rating: 5,
    },
    {
      quote: "The platform makes it incredibly easy to find and coordinate food donations. Our shelter now receives fresh meals every week.",
      author: "Yamamoto Kenji",
      role: "Director, Hope Shelter Tokyo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face",
      rating: 5,
    },
    {
      quote: "Real-time coordination and easy communication make food rescue efficient and impactful.",
      author: "Suzuki Aiko",
      role: "Coordinator, Community Kitchen Network",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face",
      rating: 5,
    },
  ];

  return (
    <Layout showFooter>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Food sharing"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>

        <div className="container relative mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20">
              <Leaf className="h-4 w-4 text-green-400" />
              <span className="text-sm text-primary-foreground/90">Join 150+ restaurants reducing food waste</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Reduce Food Waste.{' '}
              <span className="text-orange-300">Feed Communities.</span>
            </h1>

            <p className="text-lg text-primary-foreground/80 max-w-xl">
              Connect your restaurant's excess food with local shelters and NGOs. 
              Every meal shared is a step towards a hunger-free community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="xl" 
                variant="hero"
                onClick={() => navigate('/register?role=donor')}
              >
                <UtensilsCrossed className="h-5 w-5" />
                Donate Food
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                size="xl" 
                variant="heroOutline"
                onClick={() => navigate('/register?role=ngo')}
              >
                <HandHeart className="h-5 w-5" />
                Find Food
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{(impactStats.mealsServed / 1000).toFixed(1)}K+</p>
                <p className="text-sm text-primary-foreground/60">Meals Served</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{impactStats.ngosConnected}+</p>
                <p className="text-sm text-primary-foreground/60">NGOs Connected</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-foreground">{impactStats.restaurantsActive}+</p>
                <p className="text-sm text-primary-foreground/60">Active Restaurants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-background">
            <path d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" />
          </svg>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to turn excess food into community impact
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="bento-card text-center group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative mb-6 inline-flex">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors duration-300">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Collective Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Together, we're making a measurable difference in fighting food waste and hunger
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <StatCard 
              icon={UtensilsCrossed} 
              label="Meals Served" 
              value={impactStats.mealsServed}
              trend={{ value: 23, isPositive: true }}
              delay={0}
            />
            <StatCard 
              icon={Heart} 
              label="Donations Completed" 
              value={impactStats.donationsCompleted}
              trend={{ value: 18, isPositive: true }}
              delay={100}
            />
            <StatCard 
              icon={Users} 
              label="NGOs Connected" 
              value={impactStats.ngosConnected}
              trend={{ value: 12, isPositive: true }}
              delay={200}
            />
            <StatCard 
              icon={Leaf} 
              label="Food Waste Prevented" 
              value={impactStats.foodWastePrevented}
              suffix=" tons"
              trend={{ value: 31, isPositive: true }}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stories of Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from restaurants and organizations making a difference
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bento-card relative"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
                
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-6 relative z-10">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Features Teaser */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Coming Soon</h2>
              <p className="text-muted-foreground">
                We're constantly improving to serve you better
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Map Integration Placeholder */}
              <div className="bento-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Map Integration</h3>
                </div>
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDIwIEwgMjAgMjAgMjAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTNjNWZkIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50" />
                  <div className="relative flex flex-col items-center gap-2 text-blue-600/70">
                    <MapPin className="h-10 w-10" />
                    <span className="text-sm font-medium">Interactive Map View</span>
                  </div>
                </div>
              </div>

              {/* Language Toggle Placeholder */}
              <div className="bento-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Multi-Language Support</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium">English</span>
                    <div className="h-5 w-10 rounded-full bg-primary/20 relative">
                      <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 opacity-60">
                    <span className="font-medium">日本語</span>
                    <div className="h-5 w-10 rounded-full bg-muted relative">
                      <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-muted-foreground/30" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Japanese language support coming Q2 2025
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bento-card bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of restaurants and organizations already reducing food waste 
              and feeding communities across Japan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/register')}>
                Get Started Today
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Already have an account? Login
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
