"use client";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalculatorIcon } from "lucide-react";

const CalculatorButton = ({ value, onClick, className = "" }) => (
    <Button variant="outline" className={`w-16 h-16 text-xl font-bold ${className}`} onClick={() => onClick(value)}>
        {value}
    </Button>
);

export default function Calculator() {
    const [display, setDisplay] = useState('0');
    const [currentValue, setCurrentValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = (digit) => {
        if (waitingForOperand) {
            setDisplay(String(digit));
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? String(digit) : display + digit);
        }
    };

    const inputDot = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const clearDisplay = () => {
        setDisplay('0');
        setCurrentValue(null);
        setOperator(null);
        setWaitingForOperand(false);
    };

    const performOperation = (nextOperator) => {
        const inputValue = parseFloat(display);

        if (currentValue === null) {
            setCurrentValue(inputValue);
        } else if (operator) {
            const result = calculate(currentValue, inputValue, operator);
            setCurrentValue(result);
            setDisplay(String(result));
        }

        setWaitingForOperand(true);
        setOperator(nextOperator);
    };
    
    const calculate = (firstOperand, secondOperand, op) => {
        switch(op) {
            case '+': return firstOperand + secondOperand;
            case '-': return firstOperand - secondOperand;
            case '*': return firstOperand * secondOperand;
            case '/': return firstOperand / secondOperand;
            case '=': return secondOperand;
            default: return secondOperand;
        }
    }

    const handleEquals = () => {
         const inputValue = parseFloat(display);
         if (operator && currentValue !== null) {
             const result = calculate(currentValue, inputValue, operator);
             setCurrentValue(result);
             setDisplay(String(result));
             setOperator(null);
             setWaitingForOperand(true);
         }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-100">
                    <CalculatorIcon className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[320px]">
                <DialogHeader>
                    <DialogTitle>Calculator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="bg-slate-100 text-slate-900 text-4xl font-mono text-right p-4 rounded-lg break-all">
                        {display}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <CalculatorButton value="C" onClick={clearDisplay} className="bg-red-100 text-red-700 hover:bg-red-200 col-span-2" />
                        <CalculatorButton value="/" onClick={performOperation} className="bg-amber-100 text-amber-800 hover:bg-amber-200" />
                        <CalculatorButton value="*" onClick={performOperation} className="bg-amber-100 text-amber-800 hover:bg-amber-200" />
                        
                        <CalculatorButton value="7" onClick={inputDigit} />
                        <CalculatorButton value="8" onClick={inputDigit} />
                        <CalculatorButton value="9" onClick={inputDigit} />
                        <CalculatorButton value="-" onClick={performOperation} className="bg-amber-100 text-amber-800 hover:bg-amber-200" />

                        <CalculatorButton value="4" onClick={inputDigit} />
                        <CalculatorButton value="5" onClick={inputDigit} />
                        <CalculatorButton value="6" onClick={inputDigit} />
                        <CalculatorButton value="+" onClick={performOperation} className="bg-amber-100 text-amber-800 hover:bg-amber-200" />
                        
                        <CalculatorButton value="1" onClick={inputDigit} />
                        <CalculatorButton value="2" onClick={inputDigit} />
                        <CalculatorButton value="3" onClick={inputDigit} />
                        <CalculatorButton value="=" onClick={handleEquals} className="row-span-2 bg-slate-800 text-white hover:bg-slate-700" />
                        
                        <CalculatorButton value="0" onClick={inputDigit} className="col-span-2" />
                        <CalculatorButton value="." onClick={inputDot} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}