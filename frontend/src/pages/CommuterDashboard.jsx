import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  Clock3,
  MapPinned,
  Route,
  Car,
  Navigation,
  CloudSun,
  AlertTriangle,
  TrendingUp,
  Heart,
  Sparkles,
  ArrowRight,
  Bus,
  ShieldCheck,
} from "lucide-react";

import "../styles/commuterDashboard.css";
import CommuterLayout from "../components/CommuterLayout";

const stats = [
  {
    title: "Today's Trips",
    value: "6",
    icon: <Car size={30} />,
    color: "#00d4ff",
  },
  {
    title: "Distance",
    value: "42 km",
    icon: <Route size={30} />,
    color: "#00ff95",
  },
  {
    title: "Average ETA",
    value: "18 mins",
    icon: <Clock3 size={30} />,
    color: "#ffae00",
  },
  {
    title: "Saved Routes",
    value: "12",
    icon: <Heart size={30} />,
    color: "#ff3d81",
  },
];

const destinations = [
  {
    name: "Home",
    eta: "12 mins",
    traffic: "Low",
    color: "#00d4ff",
  },
  {
    name: "Office",
    eta: "26 mins",
    traffic: "Medium",
    color: "#00ff95",
  },
  {
    name: "Airport",
    eta: "48 mins",
    traffic: "Heavy",
    color: "#ff5f5f",
  },
  {
    name: "Shopping Mall",
    eta: "19 mins",
    traffic: "Low",
    color: "#ffaa00",
  },
];

const alerts = [
  "Accident reported near Ring Road.",
  "Rain expected after 2 PM.",
  "Metro services delayed by 8 minutes.",
];

export default function CommuterDashboard() {
  const navigate = useNavigate();

  // AI recommendation state
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  // Get AI route recommendation
  const getAIRecommendation = async () => {
    setLoadingRecommendation(true);
    setRecommendationError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://127.0.0.1:8000/routes/recommend?origin=Delhi&destination=Noida",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to get AI recommendation");
      }

      setRecommendation(data);
    } catch (error) {
      console.error("AI recommendation error:", error);
      setRecommendationError(error.message);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Load recommendation when commuter dashboard opens
  useEffect(() => {
    getAIRecommendation();
  }, []);

  // Find recommended route
  const recommendedRoute = recommendation?.routes?.find(
    (route) => route.recommended,
  );

  return (
    <CommuterLayout>
      {/* HERO */}

        <motion.div
          className="hero-card"
          initial={{
            opacity: 0,
            y: 35,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
          }}
        >
          <div>
            <h1>AI Smart Travel Assistant</h1>

            <p>
              Your personalized commuting dashboard powered by AI. Receive
              smarter route suggestions, weather alerts, congestion analysis and
              estimated arrival times.
            </p>

            <div className="hero-buttons">
              <button onClick={() => navigate("/live-map")}>
                <Navigation size={18} />
                Start Navigation
              </button>

              <button
                className="secondary"
                onClick={() => navigate("/live-map")}
              >
                <MapPinned size={18} />
                View Live Map
              </button>
            </div>
          </div>

          <motion.div
            className="hero-circle"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Sparkles size={120} />
          </motion.div>
        </motion.div>

        {/* STATS */}

        <div className="stats-grid">
          {stats.map((item, index) => (
            <motion.div
              className="stat-card"
              key={index}
              initial={{
                opacity: 0,
                y: 40,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.12,
              }}
              whileHover={{
                y: -8,
                scale: 1.03,
              }}
            >
              <div
                className="icon"
                style={{
                  color: item.color,
                }}
              >
                {item.icon}
              </div>

              <div>
                <h2>{item.value}</h2>

                <span>{item.title}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* QUICK DESTINATIONS */}

        <motion.div
          className="section"
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
        >
          <h2>Quick Destinations</h2>

          <div className="destination-grid">
            {destinations.map((place, index) => (
              <motion.div
                key={index}
                whileHover={{
                  scale: 1.05,
                }}
                className="destination-card"
              >
                <div
                  className="traffic-dot"
                  style={{
                    background: place.color,
                  }}
                />

                <h3>{place.name}</h3>

                <p>ETA : {place.eta}</p>

                <span>Traffic : {place.traffic}</span>

                <button onClick={() => navigate("/prediction")}>
                  Navigate
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI ROUTE + WEATHER */}

        <div className="two-column-grid">
          {/* AI ROUTE RECOMMENDATION */}

          <motion.div
            className="ai-card"
            initial={{
              opacity: 0,
              x: -40,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.6,
            }}
            whileHover={{
              y: -5,
            }}
          >
            <div className="card-header">
              <Sparkles size={22} />

              <h2>AI Route Recommendation</h2>
            </div>

            <div className="route-box">
              <div className="route">
                <Navigation size={20} />

                <div>
                  <h3>
                    {recommendation
                      ? `${recommendation.origin} → ${recommendation.destination}`
                      : "AI Route Recommendation"}
                  </h3>

                  <span>
                    {recommendation
                      ? `Recommended Route: ${recommendation.recommendation}`
                      : loadingRecommendation
                        ? "Analyzing traffic..."
                        : "No recommendation available"}
                  </span>
                </div>
              </div>

              {/* ROUTE DETAILS */}

              <div className="route-details">
                <div>
                  <h4>ETA</h4>

                  <span>
                    {recommendedRoute
                      ? `${recommendedRoute.estimated_travel_time_minutes} mins`
                      : "--"}
                  </span>
                </div>

                <div>
                  <h4>Traffic</h4>

                  <span
                    className={
                      recommendedRoute?.congestion_level === "Low"
                        ? "green"
                        : recommendedRoute?.congestion_level === "Medium"
                          ? "orange"
                          : ""
                    }
                  >
                    {recommendedRoute
                      ? recommendedRoute.congestion_level
                      : "--"}
                  </span>
                </div>

                <div>
                  <h4>Distance</h4>

                  <span>
                    {recommendedRoute
                      ? `${recommendedRoute.distance_km} km`
                      : "--"}
                  </span>
                </div>
              </div>

              {/* AI MESSAGE */}

              <div className="ai-message">
                {loadingRecommendation && (
                  <span>AI is analyzing current traffic conditions...</span>
                )}

                {recommendationError && <span>{recommendationError}</span>}

                {recommendation &&
                  !loadingRecommendation &&
                  !recommendationError && (
                    <>
                      AI recommends{" "}
                      <strong>{recommendation.recommendation}</strong> based on
                      current traffic conditions. The estimated travel time is{" "}
                      <strong>
                        {recommendedRoute?.estimated_travel_time_minutes}{" "}
                        minutes
                      </strong>
                      .
                    </>
                  )}
              </div>

              {/* NAVIGATION BUTTON */}

              <button
                onClick={() => navigate("/live-map")}
                disabled={!recommendation}
              >
                Start AI Navigation
              </button>
            </div>
          </motion.div>

          {/* WEATHER */}

          <motion.div
            className="weather-card"
            initial={{
              opacity: 0,
              x: 40,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.6,
            }}
            whileHover={{
              y: -5,
            }}
          >
            <div className="card-header">
              <CloudSun size={24} />

              <h2>Weather</h2>
            </div>

            <div className="weather-main">
              <CloudSun size={70} />

              <div>
                <h1>29°C</h1>

                <span>Partly Cloudy</span>
              </div>
            </div>

            <div className="weather-grid">
              <div>
                <h4>Humidity</h4>

                <span>74%</span>
              </div>

              <div>
                <h4>Wind</h4>

                <span>14 km/h</span>
              </div>

              <div>
                <h4>Visibility</h4>

                <span>8 km</span>
              </div>

              <div>
                <h4>UV</h4>

                <span>Moderate</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ALERTS */}

        <motion.div
          className="section"
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
        >
          <h2>Live Traffic Alerts</h2>

          <div className="alert-list">
            {alerts.map((alert, index) => (
              <motion.div
                key={index}
                className="alert-card"
                whileHover={{
                  scale: 1.02,
                }}
              >
                <AlertTriangle size={22} />

                <span>{alert}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* WEEKLY ANALYTICS */}

        <motion.div
          className="analytics-card"
          initial={{
            opacity: 0,
            y: 40,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className="card-header">
            <TrendingUp size={22} />

            <h2>Weekly Travel Summary</h2>
          </div>

          <div className="analytics-grid">
            <div>
              <h1>168 km</h1>

              <span>Total Distance</span>
            </div>

            <div>
              <h1>12 hrs</h1>

              <span>Travel Time</span>
            </div>

            <div>
              <h1>91%</h1>

              <span>On-Time Arrivals</span>
            </div>

            <div>
              <h1>24</h1>

              <span>Trips Completed</span>
            </div>
          </div>
        </motion.div>

        {/* BOTTOM GRID */}

        <div className="bottom-grid">
          {/* FAVORITE ROUTES */}

          <motion.div
            className="favorites-card"
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            whileHover={{
              y: -5,
            }}
          >
            <div className="card-header">
              <Heart size={22} />

              <h2>Favorite Routes</h2>
            </div>

            <div className="favorite-item">
              <div>
                <h3>Home → College</h3>

                <span>12 km • 16 mins</span>
              </div>

              <button onClick={() => navigate("/prediction")}>Go</button>
            </div>

            <div className="favorite-item">
              <div>
                <h3>College → Bus Stand</h3>

                <span>8 km • 11 mins</span>
              </div>

              <button onClick={() => navigate("/prediction")}>Go</button>
            </div>

            <div className="favorite-item">
              <div>
                <h3>Home → Airport</h3>

                <span>56 km • 54 mins</span>
              </div>

              <button onClick={() => navigate("/prediction")}>Go</button>
            </div>
          </motion.div>

          {/* PUBLIC TRANSPORT */}

          <motion.div
            className="transport-card"
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            whileHover={{
              y: -5,
            }}
          >
            <div className="card-header">
              <Bus size={22} />

              <h2>Public Transport</h2>
            </div>

            <div className="transport-item">
              <Bus size={18} />

              <div>
                <h3>Bus 21A</h3>

                <span>Arriving in 4 mins</span>
              </div>
            </div>

            <div className="transport-item">
              <Bus size={18} />

              <div>
                <h3>Bus 47C</h3>

                <span>Arriving in 9 mins</span>
              </div>
            </div>

            <div className="transport-item">
              <Bus size={18} />

              <div>
                <h3>Metro Line 2</h3>

                <span>Delayed by 6 mins</span>
              </div>
            </div>
          </motion.div>

          {/* RECENT TRIPS */}

          <motion.div
            className="recent-card"
            initial={{
              opacity: 0,
              y: 40,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            whileHover={{
              y: -5,
            }}
          >
            <div className="card-header">
              <Clock3 size={22} />

              <h2>Recent Trips</h2>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Route</th>

                  <th>Time</th>

                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Home → College</td>

                  <td>08:15 AM</td>

                  <td className="green">Completed</td>
                </tr>

                <tr>
                  <td>College → Bus Stand</td>

                  <td>02:10 PM</td>

                  <td className="green">Completed</td>
                </tr>

                <tr>
                  <td>Bus Stand → Home</td>

                  <td>06:40 PM</td>

                  <td className="orange">Scheduled</td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* QUICK ACTIONS */}

        <motion.div
          className="quick-actions"
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
        >
          <h2>Quick Actions</h2>

          <div className="action-grid">
            <button onClick={() => navigate("/prediction")}>
              <Navigation size={22} />
              Navigate
            </button>

            <button onClick={() => navigate("/alerts")}>
              <Bell size={22} />
              Alerts
            </button>

            <button onClick={() => navigate("/prediction")}>
              <Route size={22} />
              My Routes
            </button>

            <button onClick={() => navigate("/live-map")}>
              <MapPinned size={22} />
              Live Map
            </button>
          </div>
        </motion.div>

        {/* SAFETY CARD */}

        <motion.div
          className="safety-card"
          initial={{
            opacity: 0,
            y: 40,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
        >
          <ShieldCheck size={50} />

          <div>
            <h2>Safety Score</h2>

            <p>
              Your driving route is considered safe today. AI predicts low
              congestion and no severe weather conditions.
            </p>
          </div>

          <h1>96%</h1>
        </motion.div>
    </CommuterLayout>
  );
}
