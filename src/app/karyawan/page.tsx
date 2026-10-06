"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Plus,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useAppContext } from "@/components/MainLayout";
import { useRouter } from "next/navigation";
const API_URL =
  "https://script.google.com/macros/s/AKfycbwMTwTLCd0x_lhdnj9QqPLUUKxoR__NwnIuL3Ml1Rfy9yS6-Tz6wPBxQScxovXy_PAWlQ/exec";
interface Employee {
  rowNumber?: number;
  cabang: string;
  dept: string;
  empId: string;
  name: string;
  posId: string;
  jabatan: string;
  unit: string;
  joinDate: string;
  masaKerjaStr: string;
  masaKerja: string;
  rawJoinDate?: string;
}
export default function DataKaryawan() {
  const { isDarkMode, userRole } = useAppContext();
  const router = useRouter();
  useEffect(() => {
    if (userRole !== "atasan") {
      router.push("/form-cuti-sakit");
    }
  }, [userRole, router]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        /* agar langsung tampil */ const cached =
          localStorage.getItem("karyawanData");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (
              Array.isArray(parsed) &&
              parsed.length > 0 &&
              parsed[0].name !== undefined
            ) {
              setEmployees(parsed);
              setIsLoading(false);
            } else {
              /* hapus cache */ localStorage.removeItem("karyawanData");
            }
          } catch (e) {
            localStorage.removeItem("karyawanData");
          }
        }
        const response = await fetch(API_URL);
        const data = await response.json();
        const formattedData = data.map((item: any, index: number) => {
          let formattedDate = "-";
          let rawJoinDate = "";
          if (item["Tanggal Gabung di LJR"]) {
            const date = new Date(item["Tanggal Gabung di LJR"]);
            formattedDate = date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            rawJoinDate = date.toISOString().split("T")[0];
          }
          return {
            rowNumber: item.rowNumber || index + 2,
            cabang: item["CABANG"] || "-",
            dept: item["Department"] || "-",
            empId: item["Employee Id"] || "-",
            name: item["Employee Name"] || "-",
            posId: item["Position ID"] || "-",
            jabatan: item["Jabatan"] || "-",
            unit: item["Unit"] || "-",
            joinDate: formattedDate,
            rawJoinDate: rawJoinDate,
            masaKerjaStr: item["Lama Masa berkerja"] || "-",
            masaKerja: item["Masa Kerja"] || "0 Tahun",
          };
        });
        setEmployees(formattedData);
        localStorage.setItem("karyawanData", JSON.stringify(formattedData));
        setIsLoading(false);
      } catch (error) {
        console.error("Gagal mengambil data dari Google Sheets:", error);
        setIsLoading(false);
      }
    };
    fetchEmployees();
  }, []);
  const [showFilter, setShowFilter] = useState(false);
  const [filterCabang, setFilterCabang] = useState("");
  const filteredEmployees = employees.filter((emp) => {
    const matchSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cabang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterCabang === "" || emp.cabang === filterCabang;
    return matchSearch && matchFilter;
  });
  const uniqueCabangs = Array.from(new Set(employees.map((e) => e.cabang)))
    .filter((c) => c !== "-")
    .sort();
  const handleExport = () => {
    if (filteredEmployees.length === 0)
      return alert("Tidak ada data untuk di-export");
    const headers = [
      "Cabang",
      "Department",
      "Employee Id",
      "Name",
      "Position ID",
      "Jabatan",
      "Unit",
      "Join Date",
      "Masa Kerja Lengkap",
      "Masa Kerja (Tahun)",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredEmployees.map((emp) =>
        [
          `"${emp.cabang}"`,
          `"${emp.dept}"`,
          `"${emp.empId}"`,
          `"${emp.name}"`,
          `"${emp.posId}"`,
          `"${emp.jabatan}"`,
          `"${emp.unit}"`,
          `"${emp.joinDate}"`,
          `"${emp.masaKerjaStr}"`,
          `"${emp.masaKerja}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Data_Karyawan_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRowNumber, setEditingRowNumber] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    CABANG: "",
    Department: "",
    "Employee Id": "",
    "Employee Name": "",
    "Position ID": "",
    Jabatan: "",
    Unit: "",
    "Tanggal Gabung di LJR": "",
  });
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setNewEmployee({ ...newEmployee, [e.target.name]: e.target.value });
  };
  const handleEditClick = (emp: Employee) => {
    if (!emp.rowNumber) {
      alert(
        "Error: rowNumber tidak ditemukan. Pastikan Google Apps Script Anda mengembalikan rowNumber.",
      );
      return;
    }
    setEditingRowNumber(emp.rowNumber);
    setIsEditMode(true);
    setNewEmployee({
      CABANG: emp.cabang !== "-" ? emp.cabang : "",
      Department: emp.dept !== "-" ? emp.dept : "",
      "Employee Id": emp.empId !== "-" ? emp.empId : "",
      "Employee Name": emp.name !== "-" ? emp.name : "",
      "Position ID": emp.posId !== "-" ? emp.posId : "",
      Jabatan: emp.jabatan !== "-" ? emp.jabatan : "",
      Unit: emp.unit !== "-" ? emp.unit : "",
      "Tanggal Gabung di LJR": emp.rawJoinDate || "",
    });
    setIsModalOpen(true);
  };
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingRowNumber(null);
    setNewEmployee({
      CABANG: "",
      Department: "",
      "Employee Id": "",
      "Employee Name": "",
      "Position ID": "",
      Jabatan: "",
      Unit: "",
      "Tanggal Gabung di LJR": "",
    });
    setIsModalOpen(true);
  };
  const handleDeleteClick = async (emp: Employee) => {
    if (!emp.rowNumber) {
      alert("Error: rowNumber tidak ditemukan.");
      return;
    }
    if (
      confirm(
        `Peringatan: Anda akan menghapus data karyawan ${emp.name}. Apakah Anda yakin?`,
      )
    ) {
      try {
        const payload = {
          action: "deleteKaryawan",
          sheetName: "Daftar Karyawan",
          rowNumber: emp.rowNumber,
        };
        const response = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.status === "success") {
          alert("Data karyawan berhasil dihapus!");
          window.location.reload();
        } else {
          alert(
            "Gagal menghapus karyawan. Pastikan Google Apps Script sudah diperbarui.",
          );
        }
      } catch (error) {
        alert("Terjadi kesalahan saat menghubungi server Google Sheets.");
      }
    }
  };
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = isEditMode
        ? {
            action: "editKaryawan",
            sheetName: "Daftar Karyawan",
            rowNumber: editingRowNumber,
            data: newEmployee,
          }
        : { sheetName: "Daftar Karyawan", data: newEmployee };
      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.status === "success") {
        alert(
          isEditMode
            ? "Data karyawan berhasil diperbarui!"
            : "Data karyawan berhasil ditambahkan ke Google Sheets!",
        );
        setIsModalOpen(false);
        setNewEmployee({
          CABANG: "",
          Department: "",
          "Employee Id": "",
          "Employee Name": "",
          "Position ID": "",
          Jabatan: "",
          Unit: "",
          "Tanggal Gabung di LJR": "",
        });
        setIsEditMode(false);
        setEditingRowNumber(null);
        window.location.reload();
      } else {
        alert(
          "Gagal memproses data. Pastikan Google Apps Script sudah diperbarui dengan fungsi editKaryawan.",
        );
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menghubungi server Google Sheets.");
    }
    setIsSubmitting(false);
  };
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  const clientStats = employees.reduce(
    (acc, emp) => {
      if (!emp.cabang || emp.cabang === "-") return acc;
      const prefix = emp.cabang.split(" ")[0].toUpperCase();
      if (!acc[prefix])
        acc[prefix] = { totalKaryawan: 0, cabangSet: new Set() };
      acc[prefix].totalKaryawan += 1;
      acc[prefix].cabangSet.add(emp.cabang);
      return acc;
    },
    {} as Record<string, { totalKaryawan: number; cabangSet: Set<string> }>,
  );
  const clientBreakdown = Object.entries(clientStats).map(
    ([prefix, stats]) => ({
      prefix,
      totalCabang: stats.cabangSet.size,
      totalKaryawan: stats.totalKaryawan,
    }),
  );
  return (
    <div className="flex flex-col min-h-[800px] md:h-full space-y-4">
      {" "}
      {/* Modal Tambah Karyawan */}{" "}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          {" "}
          <div
            className={`w-full max-w-xl rounded-xl shadow-xl overflow-hidden ${isDarkMode ? "bg-gray-800 border border-gray-700" : "bg-white"}`}
          >
            {" "}
            <div
              className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-200 bg-gray-50"}`}
            >
              {" "}
              <h3
                className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-gray-800"}`}
              >
                {" "}
                {isEditMode
                  ? "Edit Data Karyawan"
                  : "Tambah Karyawan Baru"}{" "}
              </h3>{" "}
              <button
                onClick={() => setIsModalOpen(false)}
                className={`text-2xl leading-none ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
              >
                &times;
              </button>{" "}
            </div>{" "}
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              {" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Nama Karyawan *
                  </label>{" "}
                  <input
                    required
                    name="Employee Name"
                    value={newEmployee["Employee Name"]}
                    onChange={handleInputChange}
                    type="text"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    ID Karyawan *
                  </label>{" "}
                  <input
                    required
                    name="Employee Id"
                    value={newEmployee["Employee Id"]}
                    onChange={handleInputChange}
                    type="text"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Cabang *
                  </label>{" "}
                  <input
                    required
                    name="CABANG"
                    value={newEmployee["CABANG"]}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="Misal: AAM Jakarta"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Department
                  </label>{" "}
                  <input
                    name="Department"
                    value={newEmployee["Department"]}
                    onChange={handleInputChange}
                    type="text"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Jabatan *
                  </label>{" "}
                  <input
                    required
                    name="Jabatan"
                    value={newEmployee["Jabatan"]}
                    onChange={handleInputChange}
                    type="text"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Position ID
                  </label>{" "}
                  <input
                    name="Position ID"
                    value={newEmployee["Position ID"]}
                    onChange={handleInputChange}
                    type="text"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Unit
                  </label>{" "}
                  <input
                    name="Unit"
                    value={newEmployee["Unit"]}
                    onChange={handleInputChange}
                    placeholder="Mobil/Motor"
                    type="text"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label
                    className={`block text-xs font-semibold mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Tanggal Gabung *
                  </label>{" "}
                  <input
                    required
                    name="Tanggal Gabung di LJR"
                    value={newEmployee["Tanggal Gabung di LJR"]}
                    onChange={handleInputChange}
                    type="date"
                    className={`w-full p-2 border rounded-md focus:ring-1 focus:ring-[#0c392c] outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white style-color-scheme-dark" : "bg-white border-gray-300"}`}
                  />{" "}
                </div>{" "}
              </div>{" "}
              <div
                className={`mt-6 flex justify-end gap-3 pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
              >
                {" "}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${isDarkMode ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  Batal
                </button>{" "}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md bg-[#0c392c] text-white hover:bg-[#082a20] disabled:opacity-50"
                >
                  {" "}
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isEditMode ? null : (
                    <Plus size={16} />
                  )}{" "}
                  {isSubmitting
                    ? "Menyimpan..."
                    : isEditMode
                      ? "Simpan Perubahan"
                      : "Simpan Karyawan"}{" "}
                </button>{" "}
              </div>{" "}
            </form>{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Summary Cards */}{" "}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {" "}
        <div
          className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          {" "}
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            {" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>{" "}
          </div>{" "}
          <div>
            {" "}
            <p
              className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Total Karyawan Dedicated (All)
            </p>{" "}
            <h3
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {" "}
              {isLoading
                ? "..."
                : new Intl.NumberFormat("id-ID").format(employees.length)}{" "}
            </h3>{" "}
          </div>{" "}
        </div>{" "}
        <div
          className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          {" "}
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            {" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>{" "}
          </div>{" "}
          <div>
            {" "}
            <p
              className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Total Cabang Keseluruhan
            </p>{" "}
            <h3
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              {" "}
              {isLoading ? "..." : uniqueCabangs.length}{" "}
            </h3>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Breakdown per Customer */}{" "}
      {!isLoading && clientBreakdown.length > 0 && (
        <div
          className={`p-4 rounded-xl border shadow-sm ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          {" "}
          <h4
            className={`text-sm font-bold mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            Detail Karyawan & Cabang per Customer
          </h4>{" "}
          <div className="flex flex-wrap gap-2">
            {" "}
            {clientBreakdown.map((client) => (
              <div
                key={client.prefix}
                className={`px-3 py-2 rounded-lg border text-sm flex gap-3 items-center ${isDarkMode ? "bg-gray-900/50 border-gray-600 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}
              >
                {" "}
                <span className="font-bold whitespace-nowrap">
                  {client.prefix}
                </span>{" "}
                <span
                  className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${isDarkMode ? "bg-gray-700" : "bg-white border"}`}
                >
                  {" "}
                  {client.totalCabang} Cabang{" "}
                </span>{" "}
                <span
                  className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${isDarkMode ? "bg-gray-700" : "bg-white border"}`}
                >
                  {" "}
                  {client.totalKaryawan} Karyawan{" "}
                </span>{" "}
              </div>
            ))}{" "}
          </div>{" "}
        </div>
      )}{" "}
      {/* Header Actions */}{" "}
      <div
        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg shadow-sm border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}
      >
        {" "}
        <div className="flex-1 w-full relative">
          {" "}
          <input
            type="text"
            placeholder="Cari nama, ID, atau cabang..."
            value={searchTerm}
            onChange={handleSearch}
            className={`w-full max-w-md pl-10 pr-4 py-2 rounded-md border text-sm focus:outline-none focus:ring-1 focus:ring-[#0c392c] focus:border-[#0c392c] ${isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900"}`}
          />{" "}
          <Search
            size={18}
            className={`absolute left-3 top-2.5 ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}
          />{" "}
        </div>{" "}
        <div className="flex items-center gap-2 w-full sm:w-auto relative">
          {" "}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"} ${filterCabang !== "" ? "border-[#0c392c] text-[#0c392c] bg-green-50" : ""}`}
          >
            {" "}
            <Filter size={16} /> {filterCabang ? "Filter Aktif" : "Filter"}{" "}
          </button>{" "}
          {/* Dropdown Filter */}{" "}
          {showFilter && (
            <div
              className={`absolute top-full mt-1 right-0 sm:right-auto z-30 w-56 rounded-md shadow-lg border p-3 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
            >
              {" "}
              <label
                className={`block text-xs font-semibold mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                FILTER CABANG
              </label>{" "}
              <select
                value={filterCabang}
                onChange={(e) => {
                  setFilterCabang(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full text-sm rounded p-2 border focus:outline-none focus:border-[#0c392c] ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              >
                {" "}
                <option value="">Semua Cabang</option>{" "}
                {uniqueCabangs.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}{" "}
              </select>{" "}
              <div className="mt-3 flex justify-end">
                {" "}
                <button
                  onClick={() => setShowFilter(false)}
                  className={`text-xs px-3 py-1 rounded bg-[#0c392c] text-white hover:bg-[#082a20]`}
                >
                  Tutup
                </button>{" "}
              </div>{" "}
            </div>
          )}{" "}
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}`}
          >
            {" "}
            <Download size={16} /> Export{" "}
          </button>{" "}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-[#0c392c] text-white hover:bg-[#082a20] transition-colors"
          >
            {" "}
            <Plus size={16} /> Tambah Karyawan{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Table Container */}{" "}
      <div className={`flex-1 min-h-[500px] overflow-hidden rounded-lg shadow-sm border flex flex-col ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}
      >
        {" "}
        <div className="overflow-auto flex-1 relative">
          {" "}
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-20">
              {" "}
              <Loader2 className="w-8 h-8 text-[#0c392c] animate-spin mb-2" />{" "}
              <p
                className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
              >
                Mengambil data dari Google Sheets...
              </p>{" "}
            </div>
          ) : null}{" "}
          <table className="w-full text-sm text-left whitespace-nowrap">
            {" "}
            <thead
              className={`sticky top-0 z-10 ${isDarkMode ? "bg-gray-900/90 text-gray-300 border-b border-gray-700" : "bg-gray-50 text-gray-600 border-b"}`}
            >
              {" "}
              <tr>
                {" "}
                <th className="px-4 py-3 font-semibold">CABANG</th>{" "}
                <th className="px-4 py-3 font-semibold">Department</th>{" "}
                <th className="px-4 py-3 font-semibold">Employee Id</th>{" "}
                <th className="px-4 py-3 font-semibold">Employee Name</th>{" "}
                <th className="px-4 py-3 font-semibold">Position ID</th>{" "}
                <th className="px-4 py-3 font-semibold">Jabatan</th>{" "}
                <th className="px-4 py-3 font-semibold">Unit</th>{" "}
                <th className="px-4 py-3 font-semibold">Tanggal Gabung</th>{" "}
                <th className="px-4 py-3 font-semibold">Lama Masa bekerja</th>{" "}
                <th className="px-4 py-3 font-semibold">Masa Kerja</th>{" "}
                {userRole === "atasan" && (
                  <th className="px-4 py-3 font-semibold text-center">Aksi</th>
                )}{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody
              className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-100"}`}
            >
              {" "}
              {!isLoading && currentItems.length > 0 ? (
                currentItems.map((emp, index) => (
                  <tr
                    key={index}
                    className={
                      isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                    }
                  >
                    {" "}
                    <td
                      className={`px-4 py-3 font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {emp.cabang}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {emp.dept}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 font-mono text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {emp.empId}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                    >
                      {emp.name}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {emp.posId}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {emp.jabatan}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {emp.unit}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {emp.joinDate}
                    </td>{" "}
                    <td
                      className={`px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {emp.masaKerjaStr}
                    </td>{" "}
                    <td className="px-4 py-3">
                      {" "}
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${parseInt(emp.masaKerja) >= 5 ? "bg-emerald-100/10 text-emerald-600 border border-emerald-500/20" : parseInt(emp.masaKerja) >= 2 ? "bg-blue-100/10 text-blue-600 border border-blue-500/20" : "bg-amber-100/10 text-amber-600 border border-amber-500/20"}`}
                      >
                        {" "}
                        {emp.masaKerja}{" "}
                      </span>{" "}
                    </td>{" "}
                    {userRole === "atasan" && (
                      <td className="px-4 py-3 text-center">
                        {" "}
                        <div className="flex gap-1 justify-center">
                          {" "}
                          <button
                            onClick={() => handleEditClick(emp)}
                            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                            title="Edit Data"
                          >
                            {" "}
                            <Pencil size={16} />{" "}
                          </button>{" "}
                          <button
                            onClick={() => handleDeleteClick(emp)}
                            className={`p-1.5 rounded-md transition-colors ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                            title="Hapus Data"
                          >
                            {" "}
                            <Trash2 size={16} />{" "}
                          </button>{" "}
                        </div>{" "}
                      </td>
                    )}{" "}
                  </tr>
                ))
              ) : !isLoading ? (
                <tr>
                  {" "}
                  <td
                    colSpan={11}
                    className={`px-4 py-8 text-center ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}
                  >
                    {" "}
                    Tidak ada data karyawan yang cocok dengan pencarian "
                    {searchTerm}"{" "}
                  </td>{" "}
                </tr>
              ) : null}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
        <div
          className={`p-4 border-t flex justify-between items-center text-sm ${isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}
        >
          {" "}
          <span>
            {" "}
            {isLoading
              ? "Memuat data..."
              : `Menampilkan ${filteredEmployees.length === 0 ? 0 : indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredEmployees.length)} dari ${filteredEmployees.length} karyawan`}{" "}
          </span>{" "}
          <div className="flex gap-2">
            {" "}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className={`px-4 py-1.5 rounded-md border font-medium transition-colors ${currentPage === 1 || isLoading ? "opacity-50 cursor-not-allowed border-gray-300 bg-gray-50 text-gray-400" : isDarkMode ? "border-gray-600 hover:bg-gray-700 text-white" : "border-[#0c392c] text-[#0c392c] hover:bg-gray-50"}`}
            >
              {" "}
              Prev{" "}
            </button>{" "}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={
                currentPage === totalPages || totalPages === 0 || isLoading
              }
              className={`px-4 py-1.5 rounded-md border font-medium transition-colors ${currentPage === totalPages || totalPages === 0 || isLoading ? "opacity-50 cursor-not-allowed border-gray-300 bg-gray-50 text-gray-400" : isDarkMode ? "border-gray-600 hover:bg-gray-700 text-white" : "border-[#0c392c] text-[#0c392c] hover:bg-gray-50"}`}
            >
              {" "}
              Next{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}

