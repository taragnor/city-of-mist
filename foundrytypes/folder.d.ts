namespace Foundry{
  interface Folder {
    id: string;
    folder: Folder | null;
    name: string;
  }
}
