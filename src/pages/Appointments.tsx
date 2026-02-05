import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Calendar as DayCalendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Eye,
  Calendar as CalendarIcon,
  Clock,
  Car,
  DollarSign,
  Calendar,
  MessageCircle,
  CheckCircle,
  XCircle,

} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AppointmentRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_year: string | null;
  car_chassis: string | null;
  service_types: string[] | null;
  message: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  created_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

const statusColors = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function Appointments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentRequest | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<{
    date: string;
    time: string;
  }>({ date: "", time: "" });
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<
    string | null
  >(null);
  const [isAppointmentDetailsDialogOpen, setIsAppointmentDetailsDialogOpen] =
    useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching appointments:", error);
        setError("Failed to load appointments");
      } else {
        setAppointments(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointment_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointment_requests" },
        (payload) => {
          console.log("Change received!", payload);
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: "pending" | "confirmed" | "completed" | "cancelled"
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("appointment_requests")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) {
        console.error("Error updating appointment status:", error);
        setError("Failed to update appointment status");
      } else {
        await fetchAppointments();
        setIsAppointmentDetailsDialogOpen(false);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const rescheduleAppointment = (appointmentId: string) => {
    const current = appointments.find((a) => a.id === appointmentId);
    setRescheduleData({
      date: current?.appointment_date || "",
      time: current?.appointment_time || "",
    });
    setAppointmentToReschedule(appointmentId);
    setIsRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async () => {
    if (
      !appointmentToReschedule ||
      !rescheduleData.date ||
      !rescheduleData.time
    ) {
      alert("Please select both date and time.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("appointment_requests")
        .update({
          appointment_date: rescheduleData.date,
          appointment_time: rescheduleData.time,
          status: "confirmed",
        })
        .eq("id", appointmentToReschedule);

      if (error) {
        console.error("Error rescheduling appointment:", error);
        setError("Failed to reschedule appointment");
      } else {
        fetchAppointments();
        setIsRescheduleModalOpen(false);
        setIsAppointmentDetailsDialogOpen(false);
        setRescheduleData({ date: "", time: "" });
        setAppointmentToReschedule(null);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const hasAppointmentOn = (d: Date) =>
    appointments.some((e) => e.appointment_date === ymd(d));

  const appointmentsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [] as AppointmentRequest[];
    const key = ymd(selectedDate);
    return appointments.filter((e) => e.appointment_date === key);
  }, [appointments, selectedDate]);

  const handleDayClick = (date?: Date) => {
    if (!date) return;
    setSelectedDate(date);
    setIsSheetOpen(true);
  };

  const formattedSelectedDate = selectedDate
    ? `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : "";

  return (
    <div>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <header className="flex flex-col items-start gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Appointment Requests
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage customer appointments and schedule new visits
            </p>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 w-full">
            {[
              { title: "Pending", status: "pending" as const, icon: Clock },
              { title: "Confirmed", status: "confirmed" as const, icon: CheckCircle },
              { title: "Completed", status: "completed" as const, icon: CheckCircle },
              { title: "Cancelled", status: "cancelled" as const, icon: XCircle },
            ].map(({ title, status, icon: Icon }) => (
              <Card key={status} className="p-4 shadow-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {appointments.filter((a) => a.status === status).length}
                    </p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </header>

        {/* Calendar - Full Width */}
        <Card className="p-2 sm:p-4 shadow-card border-border w-full">
          <DayCalendar
            mode="single"
            selected={selectedDate}
            onDayClick={handleDayClick}
            showOutsideDays
            className="w-full p-0 sm:p-3 pointer-events-auto"
            classNames={{
              months:
                "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 flex-1",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-lg font-medium",
              nav: "space-x-1 flex items-center",
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex w-full justify-around",
              head_cell:
                "text-muted-foreground rounded-md w-full sm:w-24 font-medium text-sm p-2",
              row: "flex w-full mt-2 sm:mt-3 justify-around gap-1 sm:gap-3",
              cell: "relative p-0 flex-1 h-16 sm:h-28 rounded-xl border border-border bg-primary/5 [&:has([aria-selected])]:ring-1 [&:has([aria-selected])]:ring-primary flex items-center justify-center text-center",
              day: "h-full w-full rounded-xl font-normal p-2 text-right text-base sm:text-lg",
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-40",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            modifiers={{ hasEvent: hasAppointmentOn }}
            modifiersClassNames={{
              hasEvent:
                "relative after:content-[''] after:absolute after:bottom-1 after:left-1 after:w-3 after:h-3 after:rounded-full after:bg-red-500",
            }}
          />
        </Card>

        {/* Side sheet with appointments for selected day */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent side="left" className="w-full sm:w-[420px] max-w-full">
            <SheetHeader>
              <SheetTitle className="text-xl md:text-2xl">
                Appointments on{" "}
                {formattedSelectedDate && (
                  <span className="text-muted-foreground block text-lg sm:inline">
                    ({formattedSelectedDate})
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="text-sm md:text-base">
                List of appointments for this date.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
              {appointmentsForSelectedDate.length > 0 ? (
                appointmentsForSelectedDate.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="p-4 border border-border"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {appointment.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {appointment.appointment_date}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {appointment.appointment_time}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            {appointment.car_brand} {appointment.car_model}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 min-w-max">
                        <Badge
                          className={`${statusColors[appointment.status]
                            } text-sm`}
                        >
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                    {appointment.message && (
                      <p className="mt-3 text-sm text-foreground/80 bg-accent/50 p-3 rounded-md">
                        {appointment.message}
                      </p>
                    )}
                    <div className="mt-3 text-left sm:text-right">
                      <Dialog
                        open={
                          isAppointmentDetailsDialogOpen &&
                          selectedAppointment?.id === appointment.id
                        }
                        onOpenChange={setIsAppointmentDetailsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setIsAppointmentDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xs sm:max-w-md md:max-w-2xl overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl md:text-2xl">
                              Appointment Details
                            </DialogTitle>
                            <DialogDescription className="text-sm md:text-base">
                              View and manage appointment request
                            </DialogDescription>
                          </DialogHeader>
                          {selectedAppointment && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <h4 className="font-medium text-lg">
                                    Customer Information
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">
                                        Name
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.name}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Email
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.email}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Phone
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.phone ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Appointment Date
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.appointment_date ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Appointment Time
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.appointment_time ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-medium text-lg">
                                    Vehicle Information
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <label className="text-muted-foreground">
                                        Vehicle
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.car_brand}{" "}
                                        {selectedAppointment.car_model}{" "}
                                        {selectedAppointment.car_year}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Chassis
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.car_chassis ||
                                          "Not provided"}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="text-muted-foreground">
                                        Services
                                      </label>
                                      <p className="font-medium">
                                        {selectedAppointment.service_types?.join(
                                          ", "
                                        ) || "None"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {selectedAppointment.message && (
                                <div>
                                  <label className="text-sm text-muted-foreground">
                                    Message
                                  </label>
                                  <p className="p-3 bg-secondary rounded-lg text-sm">
                                    {selectedAppointment.message}
                                  </p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2 justify-end">
                                {selectedAppointment.status === "pending" && (
                                  <Button
                                    className="w-full sm:w-auto"
                                    onClick={() => {
                                      updateAppointmentStatus(
                                        selectedAppointment.id,
                                        "confirmed"
                                      );
                                    }}
                                  >
                                    Confirm Appointment
                                  </Button>
                                )}
                                {(selectedAppointment.status === "pending" ||
                                  selectedAppointment.status ===
                                  "confirmed") && (
                                    <Button
                                      variant="outline"
                                      className="w-full sm:w-auto"
                                      onClick={() =>
                                        rescheduleAppointment(
                                          selectedAppointment.id
                                        )
                                      }
                                    >
                                      Reschedule
                                    </Button>
                                  )}
                                {selectedAppointment.status === "confirmed" && (
                                  <Button
                                    className="w-full sm:w-auto"
                                    onClick={() => {
                                      updateAppointmentStatus(
                                        selectedAppointment.id,
                                        "completed"
                                      );
                                    }}
                                  >
                                    Mark as Completed
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  asChild
                                  className="w-full sm:w-auto"
                                >
                                  <a
                                    href={`mailto:${selectedAppointment.email}?subject=Appointment Confirmation&body=Dear ${selectedAppointment.name},%0A%0AYour appointment has been confirmed.%0A%0ABest regards,%0AAutoDealer Team`}
                                  >
                                    Send Email
                                  </a>
                                </Button>
                                {(selectedAppointment.status === "pending" ||
                                  selectedAppointment.status ===
                                  "confirmed") && (
                                    <Button
                                      variant="destructive"
                                      className="w-full sm:w-auto"
                                      onClick={async () => {
                                        if (
                                          confirm(
                                            "Are you sure you want to cancel this appointment?"
                                          )
                                        ) {
                                          await updateAppointmentStatus(
                                            selectedAppointment.id,
                                            "cancelled"
                                          );
                                        }
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center text-muted-foreground border border-dashed">
                  No appointments on this day
                </Card>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Reschedule Appointment Modal */}
      <Dialog
        open={isRescheduleModalOpen}
        onOpenChange={setIsRescheduleModalOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl">
              Reschedule Appointment
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Choose a new date and time for this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="date" className="text-right text-sm font-medium">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={rescheduleData.date}
                onChange={(e) =>
                  setRescheduleData((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="time" className="text-right text-sm font-medium">
                Time
              </label>
              <Input
                id="time"
                type="time"
                value={rescheduleData.time}
                onChange={(e) =>
                  setRescheduleData((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsRescheduleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSaveReschedule}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
