const Layout = ({ sidebar, canvas, config }: any) => {
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="flex h-screen relative">
      <button
        onClick={toggleDark}
        className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded"
      >
        Toggle Dark
      </button>

      <div className="w-64 border-r p-4 bg-white dark:bg-gray-800">
        {sidebar}
      </div>

      <div className="flex-1">
        {canvas}
      </div>

      <div className="w-80 border-l p-4 bg-white dark:bg-gray-800">
        {config}
      </div>
    </div>
  );
};

export default Layout;