import { ipcRenderer } from 'electron';

export const hotCopyApi = {
  getValue(
    filePath: string,
    entryIndex: number,
    fieldName: string,
  ): Promise<any> {
    return ipcRenderer.invoke(
      'hotcopy:getValue',
      filePath,
      entryIndex,
      fieldName,
    );
  },

  addItem(
    filePath: string,
    entryIndex: number,
    fieldName: string,
    position: number,
    label?: string,
  ): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke(
      'hotcopy:addItem',
      filePath,
      entryIndex,
      fieldName,
      position,
      label,
    );
  },

  removeItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    return ipcRenderer.invoke('hotcopy:removeItem', itemId);
  },

  getItems(): Promise<any[]> {
    return ipcRenderer.invoke('hotcopy:getItems');
  },
};
