using System;
using System.Diagnostics;
using System.IO;

[assembly: System.Reflection.AssemblyTitle("KronTech")]
[assembly: System.Reflection.AssemblyProduct("KronTech")]
[assembly: System.Reflection.AssemblyVersion("1.0.0.0")]

class Program
{
    [STAThread]
    static void Main()
    {
        string projectDir = Path.GetFullPath(
            Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..")
        );

        var psi = new ProcessStartInfo();
        psi.FileName = "cmd.exe";
        psi.Arguments = "/c SET ELECTRON_RUN_AS_NODE=& npm run dev";
        psi.WorkingDirectory = projectDir;
        psi.WindowStyle = ProcessWindowStyle.Hidden;
        psi.CreateNoWindow = true;
        psi.UseShellExecute = false;

        Process.Start(psi);
    }
}
