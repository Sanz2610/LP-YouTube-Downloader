using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Web.Script.Serialization;

// QA only: inspect existing windows through Win32, without creating Shell.Application COM servers.
class ExplorerProbe {
 delegate bool Callback(IntPtr window,IntPtr state);
 [DllImport("user32.dll")] static extern bool EnumWindows(Callback callback,IntPtr state);
 [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr window);
 [DllImport("user32.dll")] static extern bool PostMessage(IntPtr window,uint message,IntPtr first,IntPtr second);
 [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr window,out uint pid);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr window,StringBuilder value,int count);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr window,StringBuilder value,int count);
 [DllImport("user32.dll")] static extern IntPtr GetThreadDesktop(uint thread);
 [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern bool GetUserObjectInformation(IntPtr obj,int index,StringBuilder name,int size,out int needed);
 static void Main(string[] args){
  var pids=new HashSet<uint>();var visible=new HashSet<uint>();var matching=new HashSet<uint>();var testFolders=new HashSet<uint>();bool matched=false;int closed=0;
  EnumWindows(delegate(IntPtr window,IntPtr state){
   var cls=new StringBuilder(256);GetClassName(window,cls,cls.Capacity);
   if(cls.ToString()!="CabinetWClass"&&cls.ToString()!="ExploreWClass")return true;
   uint pid;GetWindowThreadProcessId(window,out pid);pids.Add(pid);
   var title=new StringBuilder(1024);GetWindowText(window,title,title.Capacity);
   if(args.Length>0&&title.ToString()==args[0])matching.Add(pid);
   if(title.ToString().StartsWith("Downloads space's "))testFolders.Add(pid);
   if(IsWindowVisible(window)){
    visible.Add(pid);
    if(args.Length>0&&title.ToString().IndexOf(args[0],StringComparison.OrdinalIgnoreCase)>=0){
     matched=true;
     if(args.Length>1&&args[1]=="--close-test"&&args[0].StartsWith("Downloads space's ")){PostMessage(window,0x0010,IntPtr.Zero,IntPtr.Zero);closed++;}
    }
   }
   return true;
  },IntPtr.Zero);
  var desktop=new StringBuilder(256);int needed;GetUserObjectInformation(GetThreadDesktop(GetCurrentThreadId()),2,desktop,desktop.Capacity*2,out needed);
  Console.WriteLine(new JavaScriptSerializer().Serialize(new {desktop=desktop.ToString(),matchedVisible=matched,closedTestWindows=closed,explorerProcessCount=Process.GetProcessesByName("explorer").Length,matchedWindowPids=matching,testFolderPids=testFolders,fileWindowPids=pids,visibleFileWindowPids=visible}));
 }
}
