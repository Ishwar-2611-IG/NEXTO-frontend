
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../constants/routes";
import { SearchIcon } from "../common/icons";

interface SearchFormProps {
  className?: string;
  onSearch?: () => void;
}

const MAX_QUERY_LENGTH = 100;

export function SearchForm({
  className = "",
  onSearch,
}: SearchFormProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) return;

    const params = new URLSearchParams({ q: trimmed });

    navigate(`${ROUTES.search}?${params.toString()}`);
    onSearch?.();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`
        flex h-10 w-full min-w-0 items-center gap-2.5
        rounded-full border border-[#7E7C77]/25 bg-[#FFFCF7] px-4 shadow-[0_4px_18px_-12px_rgba(46,45,43,0.12)]
        transition-colors duration-200
        focus-within:border-[#6B7B6E]
        focus-within:bg-[#F0EBE2]
        focus-within:ring-2 focus-within:ring-[#6B7B6E]/15
        ${className}
      `}
    >
      <input
        type="search"
        name="q"
        aria-label="Search for products"
        placeholder="Search for products..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        maxLength={MAX_QUERY_LENGTH}
        autoComplete="off"
        enterKeyHint="search"
        className="
          min-w-0 w-full flex-1 bg-transparent
          text-base text-[#2E2D2B] placeholder:text-[#7E7C77]
          focus:outline-none md:text-xs
          [&::-webkit-search-cancel-button]:appearance-none
        "
      />

      <button
        type="submit"
        aria-label="Search"
        disabled={!query.trim()}
        className="
          grid size-8 shrink-0 place-items-center rounded-full
          text-[#2E2D2B]/85 transition-colors
          hover:bg-[#6B7B6E]/10 hover:text-[#6B7B6E]
          disabled:cursor-not-allowed disabled:opacity-50
          focus-visible:outline focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E]
        "
      >
        <SearchIcon
          className="h-[17px] w-[17px]"
          aria-hidden="true"
        />
      </button>
    </form>
  );
}
