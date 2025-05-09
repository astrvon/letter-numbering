"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createLetter, getLetters, type TLetter } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const letterTypes = [
  { id: "SK-PBR", name: "Surat Keterangan - Pembukaan Bank Rekening" },
  { id: "SK-PKR", name: "Surat Keterangan - Penutupan Rekening" },
  { id: "SK-KRJ", name: "Surat Keterangan - Kerjasama" },
  { id: "SK-PGW", name: "Surat Keterangan - Pegawai" },
];

const formSchema = z.object({
  letterType: z.string({
    required_error: "Please select a letter type.",
  }),
  subject: z.string().min(3, {
    message: "Subject must be at least 3 characters.",
  }),
  recipient: z.string().min(3, {
    message: "Recipient must be at least 3 characters.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
});

export default function Page() {
  const [letters, setLetters] = useState<TLetter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      letterType: undefined,
      subject: "",
      recipient: "",
      date: new Date(),
    },
  });

  const fetchLetters = async () => {
    setIsLoading(true);
    try {
      const data = await getLetters();
      setLetters(data);
    } catch (error) {
      console.error("Failed to fetch letters:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await createLetter({
        letterType: values.letterType,
        subject: values.subject,
        recipient: values.recipient,
        date: values.date,
      });
      form.reset({
        letterType: undefined,
        subject: "",
        recipient: "",
        date: new Date(),
      });
      fetchLetters();
    } catch (error) {
      console.error("Failed to create letter:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold md:text-3xl">
            Letter Numbering System
          </h1>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Create New Letter</CardTitle>
              <CardDescription>
                Generate a new letter number in the format:
                001/SK-PBR/ABR/V/2025
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="letterType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Letter Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select letter type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {letterTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This will be used in the letter number format.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Letter subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient</FormLabel>
                        <FormControl>
                          <Input placeholder="Letter recipient" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          This will determine the month and year in the letter
                          number.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Generate Letter Number
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Letters</CardTitle>
                <CardDescription>
                  List of recently generated letter numbers
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchLetters}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </CardHeader>
            <CardContent>
              {letters.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      No letters generated yet
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Letter Number
                        </TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Date
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {letters.map(
                        (letter: TLetter): React.ReactNode => (
                          <TableRow key={letter.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {letter.letter_number}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {letter.subject}
                            </TableCell>
                            <TableCell className="hidden md:table-cell whitespace-nowrap">
                              {format(new Date(letter.created_at), "PPP")}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
