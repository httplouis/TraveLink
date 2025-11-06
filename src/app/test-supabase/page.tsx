"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};


export default function TestSupabasePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("faculty");

  // fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching users:", error.message);
    } else {
      setUsers(data as User[]);
    }
    setLoading(false);
  }

  // insert user
  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("users").insert([{ name, email, role }]);
    if (error) {
      alert("Error adding user: " + error.message);
    } else {
      setName("");
      setEmail("");
      setRole("faculty");
      fetchUsers(); // refresh list
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Supabase Users Test</h1>

      {/* ADD USER FORM */}
      <form onSubmit={handleAddUser} className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Name"
          className="border p-2 rounded w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select
          className="border p-2 rounded w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="faculty">Faculty</option>
          <option value="staff">Staff</option>
          <option value="driver">Driver</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add User
        </button>
      </form>

      {/* USERS LIST */}
      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="border p-2 rounded">
              <strong>{u.name}</strong> ({u.email}) — role: {u.role}, status:{" "}
              <span className="italic">{u.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
