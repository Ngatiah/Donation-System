// components/CustomAsyncSelect.tsx
import React, { useState, useCallback, useRef } from 'react';
import AsyncSelect from 'react-select/async';
import { GroupBase, OptionsOrGroups } from 'react-select';

// Define props for your CustomAsyncSelect
interface CustomAsyncSelectProps {
  // react-hook-form props
  value: string | string[] | undefined | null; // Can be a single string or an array of strings
  onChange: (value: string | string[] | undefined | null) => void;
  onBlur: () => void;
  name?: string;

  // Select-specific props
  isMulti?: boolean; // If true, allows multiple selections
  placeholder?: string;
  className?: string;
  classNamePrefix?: string;
  isDisabled?: boolean;
  required?: boolean;

  // Async loading props
  // A function that takes inputValue (string) and returns a Promise resolving to an array of { value: string, label: string }
  loadOptions: (inputValue: string, callback: (options: OptionsOrGroups<SelectOption, GroupBase<SelectOption>>) => void) => void | Promise<OptionsOrGroups<SelectOption, GroupBase<SelectOption>>>;
  
  // Initial options to load on mount (e.g., for default values)
  defaultOptions?: boolean | OptionsOrGroups<SelectOption, GroupBase<SelectOption>>;
}

// Define the shape of options expected by react-select
export interface SelectOption {
  value: string;
  label: string;
}

const CustomAsyncSelect: React.FC<CustomAsyncSelectProps> = ({
  value,
  onChange,
  onBlur,
  name,
  isMulti = false, // Default to single select
  placeholder,
  className,
  classNamePrefix = "react-select", // Default prefix for easier styling
  isDisabled = false,
  required = false,
  loadOptions,
  defaultOptions = true, // Default to loading initial options
}) => {

  // Helper to convert form value (string or string[]) to react-select's expected format
  const getSelectValue = useCallback(() => {
    if (isMulti) {
      // If multi-select, value is expected to be string[]
      if (Array.isArray(value)) {
        return value.map(val => ({ value: val, label: val }));
      }
      return [];
    } else {
      // If single-select, value is expected to be string
      if (typeof value === 'string' && value) {
        return { value: value, label: value };
      }
      return null;
    }
  }, [value, isMulti]);

  // Helper to convert react-select's change event back to form's expected format
  const handleChange = (selected: any) => {
    if (isMulti) {
      // For multi-select, selected is an array of options
      onChange(selected ? selected.map((option: SelectOption) => option.value) : []);
    } else {
      // For single-select, selected is a single option or null
      onChange(selected ? selected.value : undefined);
    }
  };

  // Custom styling (example - you'll likely want to extend your Tailwind/CSS)
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '40px', // Standard input height
      borderColor: state.isFocused ? '#6366F1' : '#D1D5DB', // Indigo-500 on focus, gray-300 otherwise
      boxShadow: state.isFocused ? '0 0 0 1px #6366F1' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366F1' : '#9CA3AF', // Gray-400 on hover
      },
      borderRadius: '0.375rem', // Tailwind rounded-md
      backgroundColor: 'white', // Ensure it's white
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#E0E7FF', // bg-indigo-100
      borderRadius: '0.25rem', // rounded-sm
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#4F46E5', // text-indigo-700
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#4F46E5', // text-indigo-700
      '&:hover': {
        backgroundColor: '#C7D2FE', // bg-indigo-200
        color: '#3730A3', // text-indigo-900
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#EEF2FF' : 'white', // bg-indigo-50 on focus
      color: 'black', // Text color
      '&:active': {
        backgroundColor: '#C7D2FE', // bg-indigo-200 on active
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#6B7280', // text-gray-500
    }),
  };


  return (
    <AsyncSelect
      name={name}
      isMulti={isMulti}
      cacheOptions
      defaultOptions={defaultOptions} // Can be boolean true, or an array of options
      loadOptions={loadOptions}
      value={getSelectValue()}
      onChange={handleChange}
      onBlur={onBlur} // Pass react-hook-form's onBlur
      isDisabled={isDisabled}
      placeholder={placeholder || (isMulti ? "Select items..." : "Select an item...")}
      className={className}
      classNamePrefix={classNamePrefix}
      styles={customStyles} // Apply custom styles
      required={required} // HTML5 required attribute
    />
  );
};

export default CustomAsyncSelect;