import { Link } from 'react-router-dom';

function Home({ user }) {
  return (
    <div className="min-h-screen dark:bg-gray-900 dark:text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-8 lg:px-16 bg-gradient-to-r from-purple-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <p className="text-sm uppercase tracking-wider">10K+ Users Trust Us</p>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">Best Online Classroom Platform</h1>
            <p className="mt-4 text-lg">Educate is World’s Online Classroom Platform specially designed for teachers and students.</p>
            <div className="mt-6 space-x-4">
              <Link to={user ? "/my-courses" : "/register"} className="bg-blue-800 text-white px-6 py-3 rounded-md hover:bg-blue-900 transition">Get Started</Link>
              <Link to="/about" className="border border-white text-white px-6 py-3 rounded-md hover:bg-white hover:text-blue-600 transition">Learn More</Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0">
            <div className="relative">
              <img src="/assets/image.png" alt="Online Learning" className="rounded-lg shadow-lg w-full h-64 md:h-96 object-cover" />
              <div className="absolute top-4 right-4 bg-white text-black p-2 rounded-lg shadow-md">
                <span className="flex items-center space-x-2">
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">Live Class</span>
                </span>
              </div>
              <div className="absolute bottom-4 left-4 bg-white text-black p-4 rounded-lg shadow-md">
                <p className="font-semibold">Score and Solution</p>
                <div className="flex items-center mt-2">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">9/10</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-green-600">✔ 9 Correct</p>
                    <p className="text-red-600">✘ 1 Incorrect</p>
                    <p className="text-blue-600">↑ 0 Unattempted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose This App */}
      <section className="py-16 px-4 md:px-8 lg:px-16">
        <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">Why Choose LearnSphere?</h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Interactive Learning</h3>
            <p className="text-gray-600 dark:text-gray-400">Engage with live classes, quizzes, and assignments to enhance your learning experience.</p>
          </div>
          <div className="p-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Expert Teachers</h3>
            <p className="text-gray-600 dark:text-gray-400">Learn from industry experts and experienced educators dedicated to your success.</p>
          </div>
          <div className="p-6 rounded-lg shadow-md bg-white dark:bg-gray-800">
            <h3 className="text-xl font-semibold mb-2 dark:text-white">Flexible Scheduling</h3>
            <p className="text-gray-600 dark:text-gray-400">Access courses anytime, anywhere, and learn at your own pace.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 lg:px-16 bg-gray-200 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="dark:text-white">© 2025 LearnSphere. All rights reserved.</p>
          <div className="mt-4 md:mt-0 space-x-4">
            <Link to="/about" className="hover:underline dark:text-white">About</Link>
            <Link to="/privacy" className="hover:underline dark:text-white">Privacy</Link>
            <Link to="/terms" className="hover:underline dark:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;