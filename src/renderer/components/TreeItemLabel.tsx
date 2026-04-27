import React from 'react';
import Box from '@mui/material/Box';

interface TreeItemLabelProps {
  icon: React.ReactNode;
  name: string;
  depth: number;
  isBold?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  actions?: React.ReactNode;
}

export default function TreeItemLabel({
  icon,
  name,
  depth,
  isBold = false,
  onContextMenu,
  actions,
}: TreeItemLabelProps) {
  return (
    <Box
      onContextMenu={onContextMenu}
      sx={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: `${depth * 10}px`,
        width: '100%',
        '&:hover .folder-actions': {
          opacity: 1,
        },
      }}
    >
      {icon}
      <Box sx={{ flexGrow: 1, fontWeight: isBold ? 'bold' : 'normal' }}>
        {name}
      </Box>
      {actions}
    </Box>
  );
}
