
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import WhyMinions from '../components/landing/WhyMinions';
import Primitives from '../components/landing/Primitives';
import LayerModel from '../components/landing/LayerModel';
import ProgressiveComplexity from '../components/landing/ProgressiveComplexity';
import QuickStart from '../components/landing/QuickStart';
import CTABanner from '../components/landing/CTABanner';
import Footer from '../components/landing/Footer';

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
                <Hero />
                <WhyMinions />
                <Primitives />
                <LayerModel />
                <ProgressiveComplexity />
                <QuickStart />
                <CTABanner />
            </main>
            <Footer />
        </div>
    );
}
