import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useDoctor } from '@/hooks/use-doctor';
import { DoctorData } from '@/services/api';
import { Search, UserCheck, Plus, ChevronDown, Check } from 'lucide-react';

interface DoctorSelectorProps {
  value?: {
    name: string;
    licenseNumber: string;
  };
  onChange: (doctor: { name: string; licenseNumber: string }) => void;
  disabled?: boolean;
  nameLabel?: string;
  licenseLabel?: string;
  namePlaceholder?: string;
  licensePlaceholder?: string;
}

export function DoctorSelector({
  value = { name: '', licenseNumber: '' },
  onChange,
  disabled = false,
  nameLabel = "แพทย์ที่ส่งตัว",
  licenseLabel = "เลขใบอนุญาตแพทย์",
  namePlaceholder = "เลือกหรือพิมพ์ชื่อแพทย์",
  licensePlaceholder = "เลขใบอนุญาต"
}: DoctorSelectorProps) {
  const { doctors, getDoctorSuggestions, findOrCreateDoctor } = useDoctor();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Update search value when value changes
  useEffect(() => {
    setSearchValue(value.name);
  }, [value.name]);

  // Handle license input change
  const handleLicenseChange = (newLicense: string) => {
    onChange({ ...value, licenseNumber: newLicense });
  };

  // Select doctor from dropdown
  const selectDoctor = (doctor: DoctorData) => {
    onChange({
      name: doctor.name,
      licenseNumber: doctor.licenseNumber
    });
    setSearchValue(doctor.name);
    setOpen(false);
  };

  // Handle manual input (when user types custom name)
  const handleManualInput = (newName: string) => {
    onChange({ ...value, name: newName });
    setSearchValue(newName);
    
    // Clear license if name is cleared
    if (!newName.trim()) {
      onChange({ name: '', licenseNumber: '' });
    }
  };

  // Save new doctor when both fields are filled
  const handleSaveDoctor = async () => {
    if (!value.name.trim() || !value.licenseNumber.trim()) {
      return;
    }

    setIsCreatingNew(true);
    try {
      const doctor = await findOrCreateDoctor(value.name, value.licenseNumber);
      if (doctor) {
        // Update with saved doctor data
        onChange({
          name: doctor.name,
          licenseNumber: doctor.licenseNumber
        });
      }
    } finally {
      setIsCreatingNew(false);
    }
  };

  // Auto-save when both fields are complete and user moves away
  const handleBlur = () => {
    setTimeout(() => {
      if (value.name.trim() && value.licenseNumber.trim()) {
        handleSaveDoctor();
      }
    }, 200); // Delay to allow for selection
  };

  // Get filtered doctors for dropdown
  const filteredDoctors = searchValue 
    ? doctors.filter(doctor => 
        doctor.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        doctor.licenseNumber.toLowerCase().includes(searchValue.toLowerCase())
      )
    : doctors;

  // Check if current doctor exists in database
  const existingDoctor = doctors.find(d => 
    d.name === value.name && d.licenseNumber === value.licenseNumber
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Doctor Name Combobox */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            {nameLabel}
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
              >
                <span className="truncate">
                  {value.name || namePlaceholder}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="ค้นหาหรือพิมพ์ชื่อแพทย์..."
                  value={searchValue}
                  onValueChange={(value) => {
                    setSearchValue(value);
                    handleManualInput(value);
                  }}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-4 text-center">
                      <div className="text-sm text-muted-foreground mb-2">
                        ไม่พบแพทย์ในระบบ
                      </div>
                      {searchValue && (
                        <div className="text-xs text-muted-foreground">
                          พิมพ์เลขใบอนุญาตเพื่อเพิ่มแพทย์ใหม่
                        </div>
                      )}
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredDoctors.map((doctor) => (
                      <CommandItem
                        key={doctor._id}
                        value={doctor.name}
                        onSelect={() => selectDoctor(doctor)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex flex-col items-start">
                          <div className="font-medium">{doctor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            เลขใบอนุญาต: {doctor.licenseNumber}
                          </div>
                        </div>
                        <Check
                          className={`ml-2 h-4 w-4 ${
                            value.name === doctor.name ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* License Number Input */}
        <div className="space-y-2">
          <Label htmlFor="doctorLicense">{licenseLabel}</Label>
          <Input
            ref={licenseInputRef}
            id="doctorLicense"
            value={value.licenseNumber}
            onChange={(e) => handleLicenseChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={licensePlaceholder}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Status Indicator */}
      {value.name && value.licenseNumber && (
        <div className="flex items-center gap-2">
          {existingDoctor ? (
            <Badge variant="secondary" className="text-xs">
              <UserCheck className="h-3 w-3 mr-1" />
              มีในระบบแล้ว
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <Plus className="h-3 w-3 mr-1" />
              จะบันทึกใหม่เมื่อสร้าง Visit
            </Badge>
          )}
          {isCreatingNew && (
            <Badge variant="secondary" className="text-xs">
              กำลังบันทึก...
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
