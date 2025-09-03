import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  Search, 
  CreditCard,
  Banknote,
  Building,
  Plus,
  Minus,
  Calculator
} from "lucide-react";

const labTests = [
  { id: "CBC", name: "Complete Blood Count (CBC)", price: 350, category: "Hematology" },
  { id: "LDL", name: "Lipid Profile", price: 450, category: "Chemistry" },
  { id: "BS", name: "Blood Sugar (FBS)", price: 120, category: "Chemistry" },
  { id: "HBA1C", name: "HbA1c", price: 380, category: "Chemistry" },
  { id: "UA", name: "Urine Analysis", price: 150, category: "Urology" },
  { id: "TSH", name: "Thyroid Function (TSH)", price: 280, category: "Hormone" },
  { id: "CREAT", name: "Creatinine", price: 180, category: "Chemistry" },
  { id: "SGOT", name: "SGOT/SGPT", price: 220, category: "Chemistry" }
];

export default function LabOrders() {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoading, setIsLoading] = useState(false);

  const handleTestSelection = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  const getTotalPrice = () => {
    return selectedTests.reduce((total, testId) => {
      const test = labTests.find(t => t.id === testId);
      return total + (test?.price || 0);
    }, 0);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement payment processing
    setTimeout(() => setIsLoading(false), 2000);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "transfer":
        return <CreditCard className="h-4 w-4" />;
      case "insurance":
        return <Building className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ซื้อรายการตรวจ</h1>
          <p className="text-muted-foreground mt-1">เลือกรายการตรวจและชำระเงิน</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lab Tests Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                ข้อมูลคนไข้
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="patient-search">ค้นหาคนไข้</Label>
                    <Input 
                      id="patient-search"
                      placeholder="พิมพ์ชื่อหรือรหัสคนไข้"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="visit-id">Visit ID</Label>
                    <Input 
                      id="visit-id"
                      placeholder="V001"
                    />
                  </div>
                </div>
                
                {/* Selected Patient Info */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-foreground">คนไข้:</span>
                      <span className="ml-2 text-muted-foreground">นางสาว สมใจ รักดี</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">รหัส:</span>
                      <span className="ml-2 text-muted-foreground">P001</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Visit ID:</span>
                      <span className="ml-2 text-muted-foreground">V001</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">วันที่:</span>
                      <span className="ml-2 text-muted-foreground">15/01/2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lab Tests */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                เลือกรายการตรวจ
              </CardTitle>
              <CardDescription>
                เลือกรายการตรวจที่ต้องการ ({selectedTests.length} รายการ)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="ค้นหารายการตรวจ..."
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(
                    labTests.reduce((acc, test) => {
                      if (!acc[test.category]) acc[test.category] = [];
                      acc[test.category].push(test);
                      return acc;
                    }, {} as Record<string, typeof labTests>)
                  ).map(([category, tests]) => (
                    <div key={category}>
                      <Label className="font-semibold text-primary">{category}</Label>
                      <div className="space-y-2 mt-2">
                        {tests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={test.id}
                                checked={selectedTests.includes(test.id)}
                                onCheckedChange={(checked) => handleTestSelection(test.id, checked as boolean)}
                              />
                              <div>
                                <Label htmlFor={test.id} className="font-medium text-foreground cursor-pointer">
                                  {test.name}
                                </Label>
                                <p className="text-sm text-muted-foreground">รหัส: {test.id}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-primary">฿{test.price.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                สรุปคำสั่งซื้อ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {selectedTests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    ยังไม่ได้เลือกรายการตรวจ
                  </p>
                ) : (
                  selectedTests.map((testId) => {
                    const test = labTests.find(t => t.id === testId);
                    return test ? (
                      <div key={testId} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{test.name}</span>
                        <span className="font-medium">฿{test.price.toLocaleString()}</span>
                      </div>
                    ) : null;
                  })
                )}
              </div>
              
              {selectedTests.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>รวมทั้งสิ้น</span>
                    <span className="text-primary">฿{getTotalPrice().toLocaleString()}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="shadow-card-custom">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                วิธีการชำระเงิน
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-4 w-4 text-success" />
                    เงินสด
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                    โอนเงิน
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-muted/30">
                  <RadioGroupItem value="insurance" id="insurance" />
                  <Label htmlFor="insurance" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building className="h-4 w-4 text-warning" />
                    ใช้สิทธิ
                  </Label>
                </div>
              </RadioGroup>

              {paymentMethod === "insurance" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="insurance-number">เลขบัตรประกันสังคม</Label>
                  <Input 
                    id="insurance-number"
                    placeholder="กรอกเลขบัตรประกันสังคม"
                  />
                </div>
              )}

              <Button 
                onClick={handleCheckout}
                disabled={selectedTests.length === 0 || isLoading}
                className="w-full mt-6 bg-gradient-medical hover:opacity-90"
              >
                {getPaymentIcon(paymentMethod)}
                <span className="ml-2">
                  {isLoading ? "กำลังดำเนินการ..." : `ชำระเงิน ฿${getTotalPrice().toLocaleString()}`}
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}