import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import api from "../api/axios";


function Register() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();


    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        try {
            await api.post(
                "auth/register/",
                {
                    username,
                    email,
                    password,
                }
            );

            navigate("/login");

        } catch (error) {
            setError(
                "Registration failed. Please check your details."
            );
        }
    };


    return (
        <div>
            <h1>Create Account</h1>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Username</label>

                    <input
                        type="text"
                        value={username}
                        onChange={(event) =>
                            setUsername(event.target.value)
                        }
                        required
                    />
                </div>

                <div>
                    <label>Email</label>

                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            setEmail(event.target.value)
                        }
                    />
                </div>

                <div>
                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        minLength="8"
                        required
                    />
                </div>

                {error && <p>{error}</p>}

                <button type="submit">
                    Register
                </button>

            </form>

            <p>
                Already have an account?{" "}
                <Link to="/login">
                    Login
                </Link>
            </p>
        </div>
    );
}


export default Register;