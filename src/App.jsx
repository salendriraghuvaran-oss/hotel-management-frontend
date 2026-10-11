import { useEffect, useState } from "react";
import HotelDashboard from "./HotelDashboard";

function App() {
  const [foods, setFoods] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const [showDashboard, setShowDashboard] = useState(false);
  // Customer order tracking states
const [trackingOrderId, setTrackingOrderId] = useState("");
const [trackedOrder, setTrackedOrder] = useState(null);
const [trackingLoading, setTrackingLoading] = useState(false);
const [trackingError, setTrackingError] = useState("");

    // Staff login states
  const [showLogin, setShowLogin] = useState(false);
  const [staffUser, setStaffUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Fetch food menu from Spring Boot
  useEffect(() => {
    fetch("http://localhost:8080/api/foods")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load food menu");
        }
        return response.json();
      })
      .then((data) => {
        setFoods(data);
        setError("");
      })
      .catch((err) => {
        console.error("Food loading error:", err);
        setError("Unable to load foods. Please check the backend.");
      })
      .finally(() => {
        setLoadingFoods(false);
      });
  }, []);

  // Add food to cart
  const addToCart = (food) => {
    if (!food.available) {
      alert("This food is currently unavailable.");
      return;
    }

    setCart((previousCart) => {
      const existingItem = previousCart.find(
        (item) => item.id === food.id
      );

      if (existingItem) {
        return previousCart.map((item) =>
          item.id === food.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previousCart,
        {
          ...food,
          quantity: 1,
          specialInstructions: "",
        },
      ];
    });
  };

  // Increase quantity
  const increaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQuantity = (id) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Update special instructions
  const updateInstructions = (id, instructions) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id
          ? { ...item, specialInstructions: instructions }
          : item
      )
    );
  };

  // Calculate cart total
  const getTotal = () =>
    cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
// Staff login through Spring Boot
const handleStaffLogin = async (event) => {
  event.preventDefault();

  setLoginError("");
  setLoginLoading(true);

  try {
    const response = await fetch(
      "http://localhost:8080/api/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    setStaffUser(data);
    setShowLogin(false);
    setShowDashboard(true);
    setLoginPassword("");
  } catch (err) {
    setLoginError(
      err.message || "Unable to connect to the backend."
    );
  } finally {
    setLoginLoading(false);
  }
};
  // Place order through Spring Boot
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (placingOrder) {
      return;
    }

    setPlacingOrder(true);

    const orderData = {
      tableId: 2,
      items: cart.map((item) => ({
        foodId: item.id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions || "",
      })),
    };

    try {
      const response = await fetch(
        "http://localhost:8080/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      alert(
        "Order placed successfully!\n\n" +
          "Order ID: " +
          data.orderId +
          "\nStatus: " +
          data.status +
          "\nTotal Amount: ₹" +
          data.totalAmount
      );

      // Clear cart after successful order
      setCart([]);
    } catch (err) {
      console.error("Order error:", err);
      alert("Could not place order: " + err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  // Track customer order
const trackOrder = async (event) => {
  event.preventDefault();

  if (!trackingOrderId.trim()) {
    setTrackingError("Please enter an Order ID.");
    return;
  }

  setTrackingLoading(true);
  setTrackingError("");
  setTrackedOrder(null);

  try {
    const response = await fetch("http://localhost:8080/api/orders");

    if (!response.ok) {
      throw new Error("Unable to fetch orders.");
    }

    const orders = await response.json();

    const foundOrder = orders.find(
      (order) => String(order.id) === trackingOrderId.trim()
    );

    if (!foundOrder) {
      throw new Error("Order not found. Please check your Order ID.");
    }

    setTrackedOrder(foundOrder);
  } catch (err) {
    setTrackingError(err.message || "Unable to track your order.");
  } finally {
    setTrackingLoading(false);
  }
};
// Staff Login Page
if (showLogin && !showDashboard) {
  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "80px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center" }}>
        Staff Login
      </h2>

      <p style={{ textAlign: "center", color: "#666" }}>
        Login to access the Hotel Dashboard
      </p>

      <form onSubmit={handleStaffLogin}>
        <label>
          <strong>Email Address</strong>
        </label>

        <input
          type="email"
          value={loginEmail}
          onChange={(event) =>
            setLoginEmail(event.target.value)
          }
          placeholder="Enter staff email"
          required
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "8px",
            marginBottom: "20px",
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        <label>
          <strong>Password</strong>
        </label>

        <input
          type="password"
          value={loginPassword}
          onChange={(event) =>
            setLoginPassword(event.target.value)
          }
          placeholder="Enter password"
          required
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "8px",
            marginBottom: "20px",
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "6px",
          }}
        />

        {loginError && (
          <p style={{ color: "red" }}>
            {loginError}
          </p>
        )}

        <button
          type="submit"
          disabled={loginLoading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#198754",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: loginLoading ? "wait" : "pointer",
          }}
        >
          {loginLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <button
        onClick={() => {
          setShowLogin(false);
          setLoginError("");
          setLoginPassword("");
        }}
        style={{
          width: "100%",
          padding: "10px",
          marginTop: "12px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Back to Customer Menu
      </button>
    </div>
  );
}
  // Display the staff dashboard
  if (showDashboard) {
    return (
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "25px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <button
          onClick={() => {
  setShowDashboard(false);
  setStaffUser(null);
  setShowLogin(false);
  setLoginEmail("");
  setLoginPassword("");
  setLoginError("");
}}
          style={{
            padding: "12px 20px",
            backgroundColor: "#343a40",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Back to Customer Menu
        </button>

        <HotelDashboard />
      </div>
    );
  }

  // Customer ordering page
  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <h1 style={{ textAlign: "center" }}>
        Hotel Ordering System
      </h1>

      <p style={{ textAlign: "center" }}>
        Browse the menu, customize your food, and place your order.
      </p>

      {/* DASHBOARD BUTTON */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <button
          onClick={() => {
  setShowLogin(true);
  setLoginError("");
}}
          style={{
            padding: "12px 24px",
            backgroundColor: "#343a40",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Open Hotel Dashboard
        </button>
      </div>

      <hr />


      {/* CUSTOMER ORDER TRACKING */}
<div
  style={{
    margin: "25px 0",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    backgroundColor: "#f8f9fa",
  }}
>
  <h2>📦 Track Your Order</h2>

  <p>Enter your Order ID to check your order status.</p>

  <form
    onSubmit={trackOrder}
    style={{
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
    }}
  >
    <input
      type="number"
      min="1"
      value={trackingOrderId}
      onChange={(event) => setTrackingOrderId(event.target.value)}
      placeholder="Enter Order ID"
      required
      style={{
        flex: "1",
        minWidth: "180px",
        padding: "12px",
        border: "1px solid #ccc",
        borderRadius: "6px",
      }}
    />

    <button
      type="submit"
      disabled={trackingLoading}
      style={{
        padding: "12px 20px",
        backgroundColor: "#0d6efd",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
      }}
    >
      {trackingLoading ? "Checking..." : "Track Order"}
    </button>
  </form>

  {trackingError && (
    <p style={{ color: "red", marginTop: "15px" }}>
      {trackingError}
    </p>
  )}

  {trackedOrder && (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h3>Order #{trackedOrder.id}</h3>

      <p>
        <strong>Table Number:</strong> {trackedOrder.tableId}
      </p>

      <p>
        <strong>Status:</strong>{" "}
        <span style={{ color: "#198754", fontWeight: "bold" }}>
          {trackedOrder.status}
        </span>
      </p>

      <p>
        <strong>Total Amount:</strong> ₹{trackedOrder.totalAmount}
      </p>
    </div>
  )}
</div>

      {/* FOOD MENU */}
      <h2>Food Menu</h2>

      {loadingFoods && <p>Loading food menu...</p>}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {!loadingFoods && !error && foods.length === 0 && (
        <p>No foods are available.</p>
      )}

      {foods.map((food) => (
        <div
          key={food.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
            marginBottom: "15px",
          }}
        >
          <h3>{food.name}</h3>

          <p>{food.description}</p>

          <p>
            <strong>Price:</strong> ₹{food.price}
          </p>

          <p>
            <strong>Category:</strong> {food.category}
          </p>

          <p>
            <strong>Availability:</strong>{" "}
            {food.available ? "Available" : "Unavailable"}
          </p>

          <button
            onClick={() => addToCart(food)}
            disabled={!food.available}
          >
            Add to Cart
          </button>
        </div>
      ))}

      <hr />

      {/* SHOPPING CART */}
      <h2>🛒 Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "20px",
                marginBottom: "15px",
              }}
            >
              <h3>{item.name}</h3>

              <p>Price: ₹{item.price}</p>

              {/* QUANTITY CONTROLS */}
              <div>
                <button
                  onClick={() => decreaseQuantity(item.id)}
                  disabled={placingOrder}
                >
                  −
                </button>

                <span
                  style={{
                    margin: "0 15px",
                    fontWeight: "bold",
                  }}
                >
                  {item.quantity}
                </span>

                <button
                  onClick={() => increaseQuantity(item.id)}
                  disabled={placingOrder}
                >
                  +
                </button>
              </div>

              {/* SUBTOTAL */}
              <p>
                <strong>
                  Subtotal: ₹{item.price * item.quantity}
                </strong>
              </p>

              {/* SPECIAL INSTRUCTIONS */}
              <label>
                <strong>Special Instructions:</strong>
              </label>

              <br />

              <textarea
                value={item.specialInstructions}
                onChange={(event) =>
                  updateInstructions(item.id, event.target.value)
                }
                placeholder="Example: Less spicy, no onions"
                rows="3"
                disabled={placingOrder}
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  marginTop: "8px",
                  padding: "8px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}

          {/* ORDER SUMMARY */}
          <div
            style={{
              border: "2px solid #333",
              borderRadius: "8px",
              padding: "20px",
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            <h2>Total Amount: ₹{getTotal()}</h2>

            <p>Table Number: 2</p>

            {/* PLACE ORDER */}
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              style={{
                padding: "12px 30px",
                fontSize: "18px",
                cursor: placingOrder ? "wait" : "pointer",
                backgroundColor: placingOrder ? "#999" : "#198754",
                color: "white",
                border: "none",
                borderRadius: "6px",
              }}
            >
              {placingOrder ? "PLACING ORDER..." : "PLACE ORDER"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;