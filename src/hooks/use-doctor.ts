import { useState, useEffect } from 'react';
import { apiService, DoctorData } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export function useDoctor() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load all doctors
  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const doctorList = await apiService.getDoctors();
      setDoctors(doctorList);
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลแพทย์ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Find or create doctor (auto-save if not exists)
  const findOrCreateDoctor = async (name: string, licenseNumber: string): Promise<DoctorData | null> => {
    try {
      if (!name.trim() || !licenseNumber.trim()) {
        return null;
      }

      const doctor = await apiService.findOrCreateDoctor(name.trim(), licenseNumber.trim());
      
      // Update local state if new doctor was created
      const existingIndex = doctors.findIndex(d => d._id === doctor._id);
      if (existingIndex === -1) {
        setDoctors(prev => [...prev, doctor].sort((a, b) => a.name.localeCompare(b.name)));
      }

      return doctor;
    } catch (error) {
      console.error('Error finding or creating doctor:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลแพทย์ได้",
        variant: "destructive",
      });
      return null;
    }
  };

  // Search doctors by name
  const searchDoctors = (searchTerm: string): DoctorData[] => {
    if (!searchTerm.trim()) {
      return doctors;
    }

    const term = searchTerm.toLowerCase();
    return doctors.filter(doctor => 
      doctor.name.toLowerCase().includes(term) ||
      doctor.licenseNumber.toLowerCase().includes(term)
    );
  };

  // Get doctor suggestions for autocomplete
  const getDoctorSuggestions = (searchTerm: string, limit: number = 5): DoctorData[] => {
    return searchDoctors(searchTerm).slice(0, limit);
  };

  // Load doctors on mount
  useEffect(() => {
    loadDoctors();
  }, []);

  return {
    doctors,
    isLoading,
    loadDoctors,
    findOrCreateDoctor,
    searchDoctors,
    getDoctorSuggestions,
  };
}
