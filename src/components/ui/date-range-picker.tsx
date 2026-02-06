"use client"

import * as React from "react"
import { addDays, format, subDays } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DateRangePicker({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Initialize from URL or default to Last 30 Days
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const [date, setDate] = React.useState<DateRange | undefined>({
        from: fromParam ? new Date(fromParam) : subDays(new Date(), 30),
        to: toParam ? new Date(toParam) : new Date(),
    })

    // Update URL when date changes
    React.useEffect(() => {
        if (date?.from && date?.to) {
            const params = new URLSearchParams(searchParams)
            params.set("from", format(date.from, "yyyy-MM-dd"))
            params.set("to", format(date.to, "yyyy-MM-dd"))

            // Prevent infinite loop or unnecessary replace if values are same
            if (fromParam !== params.get("from") || toParam !== params.get("to")) {
                router.replace(`${pathname}?${params.toString()}`)
            }
        }
    }, [date, router, pathname, searchParams, fromParam, toParam])

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd 'de' MMM", { locale: ptBR })} -{" "}
                                    {format(date.to, "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </>
                            ) : (
                                format(date.from, "dd 'de' MMM, yyyy", { locale: ptBR })
                            )
                        ) : (
                            <span>Selecione uma data</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex">
                        <div className="flex flex-col gap-2 p-3 border-r border-border">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Períodos</div>
                            <Button variant="ghost" size="sm" className="justify-start text-xs font-normal"
                                onClick={() => setDate({ from: subDays(new Date(), 7), to: new Date() })}
                            >
                                Últimos 7 dias
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start text-xs font-normal"
                                onClick={() => setDate({ from: subDays(new Date(), 15), to: new Date() })}
                            >
                                Últimos 15 dias
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start text-xs font-normal"
                                onClick={() => setDate({ from: subDays(new Date(), 30), to: new Date() })}
                            >
                                Últimos 30 dias
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start text-xs font-normal"
                                onClick={() => setDate({ from: subDays(new Date(), 90), to: new Date() })}
                            >
                                Últimos 3 meses
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start text-xs font-normal"
                                onClick={() => setDate({ from: subDays(new Date(), 180), to: new Date() })}
                            >
                                Últimos 6 meses
                            </Button>
                            <Button variant="ghost" size="sm" className="justify-start text-xs font-normal"
                                onClick={() => setDate({ from: subDays(new Date(), 365), to: new Date() })}
                            >
                                Últimos 12 meses
                            </Button>
                        </div>
                        <div className="p-3">
                            <Calendar
                                key={date?.from?.toString()}
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
