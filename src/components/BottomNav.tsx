import { Home, ClipboardList, MapPin } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: Home, label: "Accueil", path: "/" },
    { icon: MapPin, label: "Suivi", path: "/tracking" },
    { icon: ClipboardList, label: "Commandes", path: "/my-orders" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="container max-w-lg mx-auto flex justify-around py-2 px-2">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200 ${
                active
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
              <span className={`text-[10px] font-semibold ${active ? "font-bold" : ""}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
