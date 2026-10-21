const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  search: 'M21 21l-4.5-4.5 M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  chevron: 'M9 5l7 7-7 7',
  down: 'M6 9l6 6 6-6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  building: 'M4 21V5l8-3 8 3v16 M2 21h20 M8 7h1 M15 7h1 M8 11h1 M15 11h1 M8 15h1 M15 15h1 M10 21v-3h4v3',
  check: 'M20 6L9 17l-5-5',
  calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
  edit: 'M16 3a2.1 2.1 0 0 1 3 3L8 17l-4 1 1-4L16 3 M12 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  close: 'M6 6l12 12 M18 6L6 18',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  lock: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4 M12 15v2',
  mail: 'M3 5h18v14H3z M3 5l9 8 9-8',
  shield: 'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4 M8 12l3 3 5-6',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  info: 'M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  briefcase: 'M3 7h18v14H3z M8 7V3h8v4 M3 12s9 5 18 0 M12 12v4',
}
export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.people} /></svg>
}
